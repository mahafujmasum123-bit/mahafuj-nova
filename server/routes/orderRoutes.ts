import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { inMemoryOrders } from './checkoutRoutes';
import { inMemoryProducts } from './productRoutes';
import { OrderModel } from '../models/Order';
import { isValidOrderTransition, OrderStatus } from '../../src/utils/ecommerceRules';
import { isDbConnected } from '../db';

const router = Router();

// Customer: Get my orders
router.get('/my-orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (isDbConnected()) {
      const orders = await OrderModel.find({ customerId: userId }).sort({ createdAt: -1 });
      res.json({ success: true, data: orders });
      return;
    }

    const myOrders = inMemoryOrders.filter((o) => o.customerId === userId);
    res.json({ success: true, data: myOrders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single order details
router.get('/:orderNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const user = req.user!;

    let order = inMemoryOrders.find((o) => o.orderNumber === orderNumber);

    if (!order && isDbConnected()) {
      order = await OrderModel.findOne({ orderNumber });
    }

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Verify ownership or admin privileges
    const isAdmin = ['admin', 'super_admin', 'order_manager'].includes(user.role);
    if (order.customerId !== user.userId && !isAdmin) {
      res.status(403).json({ success: false, error: 'Access denied to this order' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer: Cancel pending order
router.post('/:orderNumber/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const order = inMemoryOrders.find((o) => o.orderNumber === orderNumber);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.customerId !== user.userId && user.role !== 'admin' && user.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      res.status(400).json({
        success: false,
        error: `Cannot cancel order in "${order.status}" status. Only pending or confirmed orders can be cancelled.`,
      });
      return;
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.statusTimeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      actor: user.name,
      note: `Cancelled: ${order.cancellationReason}`,
    });

    // Restore stock
    for (const item of order.items) {
      const prod = inMemoryProducts.find((p) => p.id === item.productId || p.sku === item.sku);
      if (prod) {
        prod.stock += item.quantity;
      }
    }

    res.json({ success: true, message: 'Order cancelled and stock restored', order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: List all orders
router.get('/admin/list', requireAuth, requireRole(['admin', 'super_admin', 'order_manager']), async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let orders: any[] = [];

    if (isDbConnected()) {
      try {
        const query: any = {};
        if (status && status !== 'all') query.status = status;
        const dbOrders = await OrderModel.find(query).sort({ createdAt: -1 });
        if (dbOrders.length > 0) {
          orders = dbOrders.map((o) => ({
            id: o._id.toString(),
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            items: o.items,
            subtotal: o.subtotal,
            discount: o.discount,
            couponCode: o.couponCode,
            shippingFee: o.shippingFee,
            tax: o.tax,
            finalTotal: o.finalTotal,
            shippingAddress: o.shippingAddress,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            status: o.status,
            statusTimeline: o.statusTimeline,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
          }));
        }
      } catch (dbErr) {
        console.warn('DB order list failed, falling back to in-memory orders:', dbErr);
      }
    }

    if (orders.length === 0) {
      orders = [...inMemoryOrders];
      if (status && status !== 'all') {
        orders = orders.filter((o) => o.status === status);
      }
    }

    if (search) {
      const q = (search as string).toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: orders, total: orders.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update order status with state machine verification
router.put('/admin/:orderNumber/status', requireAuth, requireRole(['admin', 'super_admin', 'order_manager']), async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { status: nextStatus, note } = req.body;
    const user = req.user!;

    const clean = orderNumber.trim();
    const order = inMemoryOrders.find(
      (o) =>
        o.orderNumber === clean ||
        o.orderNumber === `#${clean}` ||
        o.orderNumber.replace(/^#/, '') === clean.replace(/^#/, '') ||
        o.id === clean
    );

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const currentStatus = order.status as OrderStatus;
    if (!isValidOrderTransition(currentStatus, nextStatus as OrderStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid transition from "${currentStatus}" to "${nextStatus}". Please follow the fulfillment lifecycle.`,
      });
      return;
    }

    const timelineEntry = {
      status: nextStatus as OrderStatus,
      timestamp: new Date(),
      actor: `${user.name} (${user.role})`,
      note: note || `Updated to ${nextStatus}`,
    };

    order.status = nextStatus;
    if (!order.statusTimeline) order.statusTimeline = [];
    order.statusTimeline.push(timelineEntry);

    if (nextStatus === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    if (isDbConnected()) {
      try {
        await OrderModel.findOneAndUpdate(
          {
            $or: [
              { orderNumber: order.orderNumber },
              { orderNumber: clean },
              { orderNumber: clean.replace(/^#/, '') },
              { orderNumber: `#${clean.replace(/^#/, '')}` },
            ],
          },
          {
            status: nextStatus,
            paymentStatus: order.paymentStatus,
            $push: { statusTimeline: timelineEntry },
          }
        );
      } catch (dbErr) {
        console.warn('Order status DB sync failed:', dbErr);
      }
    }

    res.json({ success: true, order, message: `Status updated to ${nextStatus}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
