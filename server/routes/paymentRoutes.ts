import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { OrderModel } from '../models/Order';
import { inMemoryOrders } from './checkoutRoutes';
import { inMemoryProducts } from './productRoutes';
import { isDbConnected } from '../db';
import {
  initiateBkashPayment,
  verifyBkashPayment,
  initiateSslcommerzPayment,
  verifySslcommerzPayment,
  getPaymentGatewayConfigStatus,
} from '../services/paymentService';

const router = Router();

/**
 * 1. GET /api/payment/config-status
 * Returns real configuration state of payment gateways
 */
router.get('/config-status', (req: Request, res: Response) => {
  const status = getPaymentGatewayConfigStatus();
  res.json({
    success: true,
    gateways: status,
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * 2. POST /api/payment/initiate
 * Initiates an online payment transaction with the selected gateway
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { orderNumber, gateway = 'bkash' } = req.body;

    if (!orderNumber) {
      res.status(400).json({ success: false, error: 'orderNumber is required' });
      return;
    }

    // Retrieve order from DB or in-memory
    let order: any = null;
    if (isDbConnected()) {
      order = await OrderModel.findOne({ orderNumber });
    }
    if (!order) {
      order = inMemoryOrders.find((o) => o.orderNumber === orderNumber);
    }

    if (!order) {
      res.status(404).json({ success: false, error: `Order "${orderNumber}" not found` });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(400).json({ success: false, error: 'This order is already paid' });
      return;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    if (gateway === 'bkash') {
      const callbackUrl = `${baseUrl}/api/payment/callback/bkash?orderNumber=${encodeURIComponent(orderNumber)}`;
      const result = await initiateBkashPayment({
        amount: order.finalTotal,
        orderNumber,
        callbackUrl,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          gateway: 'bkash',
        });
        return;
      }

      // Update order with payment ID
      if (order) {
        order.paymentTransactionId = result.paymentId;
      }

      res.json({
        success: true,
        gateway: 'bkash',
        paymentId: result.paymentId,
        redirectUrl: result.redirectUrl,
      });
      return;
    }

    if (gateway === 'sslcommerz') {
      const result = await initiateSslcommerzPayment({
        amount: order.finalTotal,
        orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        address: order.shippingAddress.street,
        city: order.shippingAddress.city,
        successUrl: `${baseUrl}/api/payment/callback/sslcommerz?status=success&orderNumber=${encodeURIComponent(orderNumber)}`,
        failUrl: `${baseUrl}/api/payment/callback/sslcommerz?status=fail&orderNumber=${encodeURIComponent(orderNumber)}`,
        cancelUrl: `${baseUrl}/api/payment/callback/sslcommerz?status=cancel&orderNumber=${encodeURIComponent(orderNumber)}`,
        ipnUrl: `${baseUrl}/api/payment/webhook/sslcommerz`,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          gateway: 'sslcommerz',
        });
        return;
      }

      res.json({
        success: true,
        gateway: 'sslcommerz',
        paymentId: result.paymentId,
        redirectUrl: result.redirectUrl,
      });
      return;
    }

    res.status(400).json({ success: false, error: `Unsupported gateway: ${gateway}` });
  } catch (err: any) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Payment initiation failed' });
  }
});

/**
 * 3. POST /api/payment/verify
 * Server-to-server payment verification
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { orderNumber, gateway, paymentId, valId } = req.body;

    if (!orderNumber) {
      res.status(400).json({ success: false, error: 'orderNumber is required' });
      return;
    }

    // Retrieve order
    let order: any = null;
    if (isDbConnected()) {
      order = await OrderModel.findOne({ orderNumber });
    }
    if (!order) {
      order = inMemoryOrders.find((o) => o.orderNumber === orderNumber);
    }

    if (!order) {
      res.status(404).json({ success: false, error: `Order "${orderNumber}" not found` });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.json({
        success: true,
        alreadyPaid: true,
        orderNumber,
        paymentStatus: 'paid',
        message: 'Order is already marked as paid.',
      });
      return;
    }

    let verificationResult;

    if (gateway === 'bkash') {
      if (!paymentId) {
        res.status(400).json({ success: false, error: 'paymentId is required for bKash verification' });
        return;
      }
      verificationResult = await verifyBkashPayment(paymentId);
    } else if (gateway === 'sslcommerz') {
      if (!valId) {
        res.status(400).json({ success: false, error: 'valId is required for SSLCOMMERZ verification' });
        return;
      }
      verificationResult = await verifySslcommerzPayment(valId);
    } else {
      res.status(400).json({ success: false, error: `Unsupported gateway: ${gateway}` });
      return;
    }

    if (!verificationResult.success || verificationResult.status !== 'paid') {
      // Transition order status to failed / cancelled
      order.paymentStatus = 'failed';
      order.status = 'pending';
      order.statusTimeline.push({
        status: 'pending',
        timestamp: new Date(),
        actor: 'Payment Gateway',
        note: `Payment verification failed: ${verificationResult.error || 'Gateway returned non-success'}`,
      });

      if (isDbConnected()) {
        await OrderModel.findOneAndUpdate(
          { orderNumber },
          {
            $set: {
              paymentStatus: 'failed',
              statusTimeline: order.statusTimeline,
            },
          }
        );
      }

      res.status(400).json({
        success: false,
        error: verificationResult.error || 'Payment verification failed',
        status: verificationResult.status,
      });
      return;
    }

    // Order reference verification: Ensure gateway transaction belongs to this specific order
    if (verificationResult.orderNumber && verificationResult.orderNumber !== orderNumber) {
      console.error(
        `🚨 [Order Fraud Warning] Gateway order reference "${verificationResult.orderNumber}" does not match target order "${orderNumber}"`
      );
      res.status(400).json({
        success: false,
        error: 'Order reference mismatch between payment gateway and target order record.',
      });
      return;
    }

    // Amount verification: Ensure paid amount matches order total
    const tolerance = 0.05;
    if (Math.abs(verificationResult.amount - order.finalTotal) > tolerance) {
      console.error(
        `🚨 [Payment Fraud Warning] Paid amount ${verificationResult.amount} does not match order finalTotal ${order.finalTotal}`
      );
      res.status(400).json({
        success: false,
        error: 'Payment amount mismatch between gateway and order record.',
      });
      return;
    }

    // Currency verification: Ensure transaction currency matches store operations
    if (verificationResult.currency && !['BDT', 'USD'].includes(verificationResult.currency.toUpperCase())) {
      res.status(400).json({
        success: false,
        error: `Unexpected transaction currency: ${verificationResult.currency}. Only BDT/USD supported.`,
      });
      return;
    }

    // Success: Transition order status to paid and confirmed
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentTransactionId = verificationResult.transactionId;
    order.statusTimeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      actor: `${gateway.toUpperCase()} Gateway`,
      note: `Payment verified successfully. TrxID: ${verificationResult.transactionId}`,
    });

    if (isDbConnected()) {
      await OrderModel.findOneAndUpdate(
        { orderNumber },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentTransactionId: verificationResult.transactionId,
            statusTimeline: order.statusTimeline,
          },
        }
      );
    }

    res.json({
      success: true,
      orderNumber,
      transactionId: verificationResult.transactionId,
      amount: verificationResult.amount,
      currency: verificationResult.currency,
      paymentStatus: 'paid',
      message: 'Payment verified and order confirmed successfully.',
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
  }
});

/**
 * 4. GET /api/payment/callback/bkash
 * bKash browser return callback
 */
router.get('/callback/bkash', async (req: Request, res: Response) => {
  const { paymentID, status, orderNumber } = req.query;

  if (status === 'cancel' || status === 'failure') {
    res.redirect(`/checkout?paymentStatus=failed&gateway=bkash&orderNumber=${orderNumber || ''}&reason=${status}`);
    return;
  }

  if (status === 'success' && paymentID) {
    res.redirect(
      `/checkout?paymentStatus=verifying&gateway=bkash&paymentId=${encodeURIComponent(
        paymentID as string
      )}&orderNumber=${orderNumber || ''}`
    );
    return;
  }

  res.redirect('/checkout?paymentStatus=unknown');
});

/**
 * 5. POST /api/payment/webhook/:gateway
 * IPN Webhook handler for instant asynchronous server-to-server notifications
 */
router.post('/webhook/:gateway', async (req: Request, res: Response) => {
  try {
    const { gateway } = req.params;
    console.log(`🔔 [Payment Webhook] Received webhook for ${gateway}:`, req.body);

    if (gateway === 'sslcommerz') {
      const { val_id, tran_id, status } = req.body;
      if (status === 'VALID' || status === 'VALIDATED') {
        const verifyRes = await verifySslcommerzPayment(val_id);
        if (verifyRes.success && verifyRes.status === 'paid') {
          // Idempotent order update
          let order = inMemoryOrders.find((o) => o.orderNumber === tran_id);
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            order.paymentTransactionId = verifyRes.transactionId;
          }
          if (isDbConnected()) {
            await OrderModel.findOneAndUpdate(
              { orderNumber: tran_id, paymentStatus: { $ne: 'paid' } },
              {
                $set: {
                  paymentStatus: 'paid',
                  status: 'confirmed',
                  paymentTransactionId: verifyRes.transactionId,
                },
              }
            );
          }
        }
      }
      res.status(200).send('IPN_PROCESSED');
      return;
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
