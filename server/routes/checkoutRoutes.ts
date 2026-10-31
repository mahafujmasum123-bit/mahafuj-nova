import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { inMemoryProducts } from './productRoutes';
import { ProductModel } from '../models/Product';
import { OrderModel, IOrder } from '../models/Order';
import { CouponModel } from '../models/Coupon';
import { INITIAL_COUPONS } from '../data/initialData';
import { calculateCartTotals, getEffectivePrice } from '../../src/utils/ecommerceRules';
import { isDbConnected } from '../db';

const router = Router();
let inMemoryOrders: any[] = [
  {
    id: 'ord-1256',
    orderNumber: '#ORD-1256',
    customerId: 'cust-1256',
    customerName: 'Rahim Khan',
    customerEmail: 'rahim.khan@example.com',
    customerPhone: '+880 1711 234567',
    items: [
      {
        productId: 'prod-1',
        sku: 'NOV-AUD-001',
        name: 'Wireless Headphones',
        price: 79.99,
        salePrice: 59.99,
        effectivePrice: 59.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      },
    ],
    subtotal: 59.99,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    finalTotal: 59.99,
    shippingAddress: {
      name: 'Rahim Khan',
      phone: '+880 1711 234567',
      division: 'Dhaka',
      district: 'Gulshan',
      street: 'Road 11, House 24',
    },
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    status: 'completed',
    createdAt: new Date('2025-03-16T14:20:00Z'),
    updatedAt: new Date('2025-03-16T15:00:00Z'),
  },
  {
    id: 'ord-1255',
    orderNumber: '#ORD-1255',
    customerId: 'cust-1255',
    customerName: 'Ayesha Akter',
    customerEmail: 'ayesha.akter@example.com',
    customerPhone: '+880 1812 345678',
    items: [
      {
        productId: 'prod-2',
        sku: 'NOV-WCH-002',
        name: 'Smart Watch',
        price: 119.99,
        salePrice: 68.99,
        effectivePrice: 68.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      },
    ],
    subtotal: 68.99,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    finalTotal: 68.99,
    shippingAddress: {
      name: 'Ayesha Akter',
      phone: '+880 1812 345678',
      division: 'Dhaka',
      district: 'Banani',
      street: 'Block E, Road 4',
    },
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    status: 'processing',
    createdAt: new Date('2025-03-16T11:45:00Z'),
    updatedAt: new Date('2025-03-16T12:00:00Z'),
  },
  {
    id: 'ord-1254',
    orderNumber: '#ORD-1254',
    customerId: 'cust-1254',
    customerName: 'Tanvir Hasan',
    customerEmail: 'tanvir.hasan@example.com',
    customerPhone: '+880 1913 456789',
    items: [
      {
        productId: 'prod-3',
        sku: 'NOV-BAG-003',
        name: 'Backpack',
        price: 49.99,
        salePrice: 49.99,
        effectivePrice: 49.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      },
    ],
    subtotal: 49.99,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    finalTotal: 49.99,
    shippingAddress: {
      name: 'Tanvir Hasan',
      phone: '+880 1913 456789',
      division: 'Chittagong',
      district: 'Agrabad',
      street: 'Commercial Area 12',
    },
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    status: 'pending',
    createdAt: new Date('2025-03-15T16:30:00Z'),
    updatedAt: new Date('2025-03-15T16:30:00Z'),
  },
  {
    id: 'ord-1253',
    orderNumber: '#ORD-1253',
    customerId: 'cust-1253',
    customerName: 'Shanta Islam',
    customerEmail: 'shanta.islam@example.com',
    customerPhone: '+880 1614 567890',
    items: [
      {
        productId: 'prod-4',
        sku: 'NOV-SHOE-004',
        name: 'Running Shoes',
        price: 69.99,
        salePrice: 69.99,
        effectivePrice: 69.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      },
    ],
    subtotal: 69.99,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    finalTotal: 69.99,
    shippingAddress: {
      name: 'Shanta Islam',
      phone: '+880 1614 567890',
      division: 'Sylhet',
      district: 'Zindabazar',
      street: 'Main Road',
    },
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    status: 'completed',
    createdAt: new Date('2025-03-15T09:15:00Z'),
    updatedAt: new Date('2025-03-15T10:00:00Z'),
  },
  {
    id: 'ord-1252',
    orderNumber: '#ORD-1252',
    customerId: 'cust-1252',
    customerName: 'Nusrat Jahan',
    customerEmail: 'nusrat.jahan@example.com',
    customerPhone: '+880 1515 678901',
    items: [
      {
        productId: 'prod-5',
        sku: 'NOV-GLS-005',
        name: 'Sunglasses',
        price: 29.99,
        salePrice: 29.99,
        effectivePrice: 29.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
      },
    ],
    subtotal: 29.99,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    finalTotal: 29.99,
    shippingAddress: {
      name: 'Nusrat Jahan',
      phone: '+880 1515 678901',
      division: 'Dhaka',
      district: 'Uttara',
      street: 'Sector 3, Road 7',
    },
    paymentMethod: 'cod',
    paymentStatus: 'cancelled',
    status: 'cancelled',
    createdAt: new Date('2025-03-14T18:00:00Z'),
    updatedAt: new Date('2025-03-14T18:30:00Z'),
  },
  {
    id: 'ord-seed-1',
    orderNumber: 'NOV-2025-108249',
    customerId: 'user-customer',
    customerName: 'Sarah Khan',
    customerEmail: 'customer@example.com',
    customerPhone: '+880 1812 345678',
    items: [
      {
        productId: 'prod-1',
        sku: 'NOV-AUD-001',
        name: 'Wireless Headphones',
        price: 79.99,
        salePrice: 59.99,
        effectivePrice: 59.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      },
      {
        productId: 'prod-2',
        sku: 'NOV-WCH-002',
        name: 'Smart Watch',
        price: 119.99,
        salePrice: 89.99,
        effectivePrice: 89.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      },
    ],
    subtotal: 149.98,
    discount: 15.00,
    couponCode: 'SAVE10',
    shippingFee: 0,
    tax: 0,
    finalTotal: 134.98,
    shippingAddress: {
      name: 'Sarah Khan',
      phone: '+880 1812 345678',
      division: 'Dhaka',
      district: 'Dhanmondi',
      upazila: 'Dhanmondi',
      street: 'House 42, Road 9/A',
      landmark: 'Opposite Dhanmondi Lake',
    },
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    status: 'pending',
    statusTimeline: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 3600000 * 4),
        actor: 'Sarah Khan',
        note: 'Order placed via Cash on Delivery',
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: 'ord-seed-2',
    orderNumber: 'NOV-2025-104921',
    customerId: 'user-guest-sample',
    customerName: 'Rafiul Islam',
    customerEmail: 'rafiul@example.com',
    customerPhone: '+880 1712 998877',
    items: [
      {
        productId: 'prod-4',
        sku: 'NOV-SHOE-004',
        name: 'Running Shoes',
        price: 69.99,
        salePrice: 69.99,
        effectivePrice: 69.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      },
    ],
    subtotal: 69.99,
    discount: 0,
    shippingFee: 60,
    tax: 0,
    finalTotal: 69.99,
    shippingAddress: {
      name: 'Rafiul Islam',
      phone: '+880 1712 998877',
      division: 'Chittagong',
      district: 'Agrabad',
      upazila: 'Double Mooring',
      street: 'Commercial Area, Block C',
      landmark: 'Near Standard Chartered Bank',
    },
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    status: 'delivered',
    statusTimeline: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 86400000 * 3),
        actor: 'Rafiul Islam',
        note: 'Order placed via bKash',
      },
      {
        status: 'confirmed',
        timestamp: new Date(Date.now() - 86400000 * 3 + 1800000),
        actor: 'Novara Admin',
        note: 'Payment verified with bKash TXN-99824',
      },
      {
        status: 'shipped',
        timestamp: new Date(Date.now() - 86400000 * 2),
        actor: 'Tariq Rahman',
        note: 'Dispatched with Paperfly Express',
      },
      {
        status: 'delivered',
        timestamp: new Date(Date.now() - 86400000 * 1),
        actor: 'Paperfly Courier Rider',
        note: 'Customer signed delivery acknowledgment',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
];
let inMemoryCoupons = JSON.parse(JSON.stringify(INITIAL_COUPONS));

// Price quote & validation (available to guests or authenticated users)
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const { items, couponCode, division = 'Dhaka', shippingMethod = 'standard' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Cart has no items' });
      return;
    }

    // Verify each item against real product catalog
    const validatedItems: any[] = [];
    for (const item of items) {
      const prod = inMemoryProducts.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!prod) {
        res.status(400).json({ success: false, error: `Product not found: ${item.name || item.productId}` });
        return;
      }

      const unitPrice = getEffectivePrice(prod.price, prod.salePrice);
      validatedItems.push({
        productId: prod.id,
        variantId: item.variantId,
        variantName: item.variantName,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        salePrice: prod.salePrice,
        effectivePrice: unitPrice,
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        image: prod.images[0]?.url || item.image,
        stock: prod.stock,
      });
    }

    // Lookup coupon
    let couponRule: any = null;
    if (couponCode) {
      const clean = couponCode.trim().toUpperCase();
      if (isDbConnected()) {
        try {
          const dbCoupon = await CouponModel.findOne({ code: clean, isActive: true });
          if (dbCoupon) {
            couponRule = {
              code: dbCoupon.code,
              discountType: dbCoupon.discountType,
              discountValue: dbCoupon.discountValue,
              minOrderAmount: dbCoupon.minOrderAmount || 0,
              maxDiscount: dbCoupon.maxDiscount,
              validFrom: dbCoupon.validFrom ? dbCoupon.validFrom.toISOString() : '2024-01-01',
              validTo: dbCoupon.validTo ? dbCoupon.validTo.toISOString() : '2028-12-31',
              isActive: dbCoupon.isActive,
            };
          }
        } catch (e) {
          console.warn('Coupon DB lookup failed, falling back to memory:', e);
        }
      }
      if (!couponRule) {
        const mem = inMemoryCoupons.find((c: any) => c.code.toUpperCase() === clean);
        if (mem) {
          couponRule = {
            code: mem.code,
            discountType: mem.discountType,
            discountValue: mem.discountValue,
            minOrderAmount: mem.minOrderAmount || mem.minOrderValue || 0,
            maxDiscount: mem.maxDiscount,
            validFrom: mem.validFrom || '2024-01-01',
            validTo: mem.validTo || mem.expiresAt || '2028-12-31',
            isActive: mem.isActive !== false,
          };
        }
      }
    }

    const totals = calculateCartTotals(validatedItems, couponRule, division, shippingMethod);

    res.json({
      success: true,
      items: validatedItems,
      ...totals,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dedicated dynamic coupon validation for client CartDrawer & Checkout
router.get('/validate-coupon/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code) {
      res.status(400).json({ success: false, error: 'Coupon code is required' });
      return;
    }
    const clean = code.trim().toUpperCase();

    let couponRule: any = null;
    if (isDbConnected()) {
      try {
        const dbCoupon = await CouponModel.findOne({ code: clean, isActive: true });
        if (dbCoupon) {
          couponRule = {
            code: dbCoupon.code,
            discountType: dbCoupon.discountType,
            discountValue: dbCoupon.discountValue,
            minOrderAmount: dbCoupon.minOrderAmount || 0,
            maxDiscount: dbCoupon.maxDiscount,
            validFrom: dbCoupon.validFrom ? dbCoupon.validFrom.toISOString() : '2024-01-01',
            validTo: dbCoupon.validTo ? dbCoupon.validTo.toISOString() : '2028-12-31',
            isActive: dbCoupon.isActive,
          };
        }
      } catch (e) {
        console.warn('DB coupon check failed:', e);
      }
    }

    if (!couponRule) {
      const memCoupon = inMemoryCoupons.find((c: any) => c.code.toUpperCase() === clean);
      if (memCoupon) {
        couponRule = {
          code: memCoupon.code,
          discountType: memCoupon.discountType,
          discountValue: memCoupon.discountValue,
          minOrderAmount: memCoupon.minOrderAmount || memCoupon.minOrderValue || 0,
          maxDiscount: memCoupon.maxDiscount,
          validFrom: memCoupon.validFrom || '2024-01-01',
          validTo: memCoupon.validTo || memCoupon.expiresAt || '2028-12-31',
          isActive: memCoupon.isActive !== false,
        };
      }
    }

    if (!couponRule) {
      res.status(404).json({ success: false, error: `Coupon "${clean}" is invalid or does not exist.` });
      return;
    }

    if (!couponRule.isActive) {
      res.status(400).json({ success: false, error: `Coupon "${clean}" is currently inactive.` });
      return;
    }

    const now = new Date().toISOString();
    if (now < couponRule.validFrom || now > couponRule.validTo) {
      res.status(400).json({ success: false, error: `Coupon "${clean}" has expired.` });
      return;
    }

    res.json({
      success: true,
      coupon: couponRule,
      message: `Coupon "${clean}" applied successfully!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Place Order (Supports Authenticated Customers & Guest Checkout)
router.post('/place-order', async (req: Request, res: Response) => {
  try {
    const authUser = req.user;
    const {
      items,
      contactInfo,
      shippingAddress,
      shippingMethod = 'standard',
      paymentMethod = 'cod',
      paymentDetails,
      couponCode,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Cannot place an order with an empty cart' });
      return;
    }

    // Determine customer email and name
    const customerEmail = (authUser?.email || contactInfo?.email || shippingAddress?.email || '').trim().toLowerCase();
    const customerPhone = (shippingAddress?.phone || contactInfo?.phone || authUser?.phone || '').trim();
    const recipientName = (shippingAddress?.name || authUser?.name || 'Valued Customer').trim();

    if (!customerEmail || !customerEmail.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'A valid email address is required for order confirmation and tracking.',
      });
      return;
    }

    if (!customerPhone) {
      res.status(400).json({
        success: false,
        error: 'A contact phone number is required for delivery logistics.',
      });
      return;
    }

    const streetAddress = (shippingAddress?.address || shippingAddress?.street || '').trim();
    if (!streetAddress) {
      res.status(400).json({
        success: false,
        error: 'Street address is required.',
      });
      return;
    }

    // Validate inventory and calculate server-side prices
    const orderItemsSnapshot: any[] = [];
    const stockUpdates: { product: any; qty: number }[] = [];

    for (const line of items) {
      const prod = inMemoryProducts.find((p) => p.id === line.productId || p.slug === line.productId);
      if (!prod) {
        res.status(400).json({ success: false, error: `Product "${line.name || line.productId}" not found` });
        return;
      }

      const requestedQty = Math.max(1, parseInt(line.quantity, 10) || 1);
      if (prod.stock < requestedQty) {
        res.status(400).json({
          success: false,
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock} units available.`,
        });
        return;
      }

      const unitPrice = getEffectivePrice(prod.price, prod.salePrice);
      orderItemsSnapshot.push({
        productId: prod.id,
        variantId: line.variantId,
        variantName: line.variantName,
        sku: prod.sku,
        name: prod.name,
        unitPrice,
        quantity: requestedQty,
        total: Math.round(unitPrice * requestedQty * 100) / 100,
        image: prod.images[0]?.url || line.image,
      });

      stockUpdates.push({ product: prod, qty: requestedQty });
    }

    // Coupon lookup & validation
    let couponRule: any = null;
    if (couponCode) {
      const clean = couponCode.trim().toUpperCase();
      if (isDbConnected()) {
        try {
          const dbCoupon = await CouponModel.findOne({ code: clean, isActive: true });
          if (dbCoupon) {
            couponRule = {
              code: dbCoupon.code,
              discountType: dbCoupon.discountType,
              discountValue: dbCoupon.discountValue,
              minOrderAmount: dbCoupon.minOrderAmount || 0,
              maxDiscount: dbCoupon.maxDiscount,
              validFrom: dbCoupon.validFrom ? dbCoupon.validFrom.toISOString() : '2024-01-01',
              validTo: dbCoupon.validTo ? dbCoupon.validTo.toISOString() : '2028-12-31',
              isActive: dbCoupon.isActive,
            };
          }
        } catch (e) {
          console.warn('Coupon DB lookup failed, falling back to memory:', e);
        }
      }
      if (!couponRule) {
        const mem = inMemoryCoupons.find((c: any) => c.code.toUpperCase() === clean);
        if (mem) {
          couponRule = {
            code: mem.code,
            discountType: mem.discountType,
            discountValue: mem.discountValue,
            minOrderAmount: mem.minOrderAmount || mem.minOrderValue || 0,
            maxDiscount: mem.maxDiscount,
            validFrom: mem.validFrom || '2024-01-01',
            validTo: mem.validTo || mem.expiresAt || '2028-12-31',
            isActive: mem.isActive !== false,
          };
        }
      }
    }

    const divisionName = shippingAddress.division || shippingAddress.state || 'Dhaka';
    const totals = calculateCartTotals(
      orderItemsSnapshot.map((i) => ({ ...i, price: i.unitPrice, stock: 999 })),
      couponRule,
      divisionName,
      shippingMethod
    );

    // Payment validation & security
    let paymentStatus: 'paid' | 'unpaid' | 'failed' = 'unpaid';
    let transactionId: string | undefined = undefined;
    let paymentMetadata: any = undefined;

    if (paymentMethod === 'card') {
      const rawCard = (paymentDetails?.cardNumber || '').replace(/\s+/g, '');
      if (rawCard && rawCard.length < 12) {
        res.status(400).json({ success: false, error: 'Invalid card number provided.' });
        return;
      }
      paymentStatus = 'paid';
      transactionId = `TXN-CARD-${Date.now().toString().slice(-6)}`;
      paymentMetadata = {
        cardLast4: rawCard ? rawCard.slice(-4) : '3456',
        cardBrand: rawCard.startsWith('4') ? 'Visa' : rawCard.startsWith('5') ? 'Mastercard' : 'Amex',
        cardExpMonth: paymentDetails?.expiry?.split('/')[0]?.trim() || '12',
        cardExpYear: paymentDetails?.expiry?.split('/')[1]?.trim() || '28',
      };
    } else if (paymentMethod === 'paypal') {
      paymentStatus = 'paid';
      transactionId = `PAYID-${Date.now()}`;
    } else if (paymentMethod === 'bkash' || paymentMethod === 'sslcommerz') {
      // Online payment gateways must start as unpaid until server verification completes
      paymentStatus = 'unpaid';
      transactionId = undefined;
    } else {
      // Cash on Delivery
      paymentStatus = 'unpaid';
    }

    // Atomically decrement stock
    for (const update of stockUpdates) {
      update.product.stock = Math.max(0, update.product.stock - update.qty);
      update.product.salesCount = (update.product.salesCount || 0) + update.qty;
    }

    // Generate unique order number
    const orderNumber = `NOV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const shippingMethodNames: Record<string, string> = {
      standard: 'Standard Shipping (3-5 business days)',
      express: 'Express Shipping (1-2 business days)',
      next_day: 'Next Day Delivery',
    };

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: authUser ? authUser.userId : `guest-${Date.now()}`,
      customerName: recipientName,
      customerEmail,
      customerPhone,
      items: orderItemsSnapshot,
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: couponRule ? couponRule.code : undefined,
      shippingFee: totals.shippingFee,
      shippingMethod,
      shippingMethodName: shippingMethodNames[shippingMethod] || 'Standard Shipping',
      tax: 0,
      finalTotal: totals.finalTotal,
      shippingAddress: {
        name: recipientName,
        phone: customerPhone,
        country: shippingAddress.country || 'Bangladesh',
        city: shippingAddress.city || 'Dhaka',
        state: shippingAddress.state || shippingAddress.division || 'Dhaka',
        postalCode: shippingAddress.postalCode || '1209',
        division: shippingAddress.division || shippingAddress.state || 'Dhaka',
        district: shippingAddress.district || shippingAddress.city || 'Dhaka',
        upazila: shippingAddress.upazila || '',
        street: streetAddress,
        landmark: shippingAddress.landmark?.trim(),
      },
      paymentMethod,
      paymentStatus,
      paymentTransactionId: transactionId,
      paymentDetails: paymentMetadata,
      status: 'pending',
      statusTimeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          actor: recipientName,
          note: `Order placed via ${paymentMethod.toUpperCase()}${transactionId ? ` (Ref: ${transactionId})` : ''}`,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryOrders.unshift(newOrder);

    if (isDbConnected()) {
      try {
        await OrderModel.create(newOrder);
      } catch (err: any) {
        console.warn('Failed to persist order to MongoDB Atlas:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      order: newOrder,
      message: `Order #${orderNumber} successfully placed!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { inMemoryOrders, inMemoryCoupons };
export default router;
