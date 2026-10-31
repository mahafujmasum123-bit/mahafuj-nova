import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth';
import { inMemoryOrders } from './checkoutRoutes';
import { inMemoryProducts } from './productRoutes';
import { INITIAL_TESTIMONIALS } from '../data/initialData';
import { ReviewModel } from '../models/Review';
import { isDbConnected } from '../db';

const router = Router();

interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
}

// Initial seed reviews matching reference design
let inMemoryReviews: ReviewItem[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    userId: 'user-customer',
    userName: 'Sarah Khan',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    rating: 5,
    title: 'Excellent sound quality!',
    comment: 'The noise cancelling works perfectly and the sound quality is amazing. Battery life is also impressive. Highly recommended!',
    isVerifiedPurchase: true,
    status: 'approved',
    helpfulCount: 24,
    createdAt: '2025-03-12',
  },
  {
    id: 'rev-2',
    productId: 'prod-1',
    userId: 'user-2',
    userName: 'Rafiul Islam',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    rating: 5,
    title: 'Great for travel',
    comment: 'I use these headphones during my flights and they are fantastic. Comfortable and lightweight. Worth every penny!',
    isVerifiedPurchase: true,
    status: 'approved',
    helpfulCount: 18,
    createdAt: '2025-03-08',
  },
  {
    id: 'rev-3',
    productId: 'prod-1',
    userId: 'user-3',
    userName: 'Tania Akter',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    rating: 5,
    title: 'Best headphones in this price range',
    comment: 'Sound quality is excellent, ANC works really well, and the design is premium. Love it!',
    isVerifiedPurchase: true,
    status: 'approved',
    helpfulCount: 12,
    createdAt: '2025-03-05',
  },
  {
    id: 'rev-4',
    productId: 'prod-2',
    userId: 'user-4',
    userName: 'Kamal Hossain',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    rating: 5,
    title: 'Clear AMOLED display',
    comment: 'AMOLED screen is super bright in sunlight. Notifications and step counting are very accurate.',
    isVerifiedPurchase: true,
    status: 'approved',
    helpfulCount: 8,
    createdAt: '2025-03-05',
  },
];

// Get approved reviews for a product
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    let reviews: any[] = [];
    if (isDbConnected()) {
      try {
        const dbReviews = await ReviewModel.find({ productId, status: 'approved' }).sort({ createdAt: -1 });
        if (dbReviews.length > 0) {
          reviews = dbReviews.map((r) => ({
            id: r._id.toString(),
            productId: r.productId,
            userId: r.userId,
            userName: r.userName,
            userAvatar: r.userAvatar,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            isVerifiedPurchase: r.isVerifiedPurchase,
            status: r.status,
            helpfulCount: r.helpfulCount || 0,
            createdAt: r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'Recent',
          }));
        }
      } catch (dbErr) {
        console.warn('DB reviews query failed, falling back:', dbErr);
      }
    }

    if (reviews.length === 0) {
      reviews = inMemoryReviews.filter((r) => r.productId === productId && r.status === 'approved');
    }

    // Calculate histogram
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sum += r.rating;
    });

    const average = reviews.length > 0 ? Math.round((sum / reviews.length) * 10) / 10 : 4.8;

    res.json({
      success: true,
      data: reviews,
      total: reviews.length > 0 ? reviews.length : 2345,
      average,
      distribution,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upvote review as helpful
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rev = inMemoryReviews.find((r) => r.id === id);
    if (rev) {
      rev.helpfulCount = (rev.helpfulCount || 0) + 1;
    }
    if (isDbConnected() && mongoose.isValidObjectId(id)) {
      await ReviewModel.findByIdAndUpdate(id, { $inc: { helpfulCount: 1 } });
    }
    res.json({ success: true, helpfulCount: rev?.helpfulCount || 1 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit review (Authenticated customer only)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { productId, rating, comment, title } = req.body;

    if (!productId || !rating || !comment) {
      res.status(400).json({ success: false, error: 'Product ID, rating (1-5), and review comment are required' });
      return;
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10)));

    // Prevent duplicate reviews
    const existing = inMemoryReviews.find((r) => r.productId === productId && r.userId === user.userId);
    if (existing) {
      res.status(400).json({ success: false, error: 'You have already submitted a review for this product.' });
      return;
    }

    // Verify purchase against authoritative order data
    const hasBought = inMemoryOrders.some(
      (o) => o.customerId === user.userId && o.items?.some((i: any) => i.productId === productId)
    );

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      productId,
      userId: user.userId,
      userName: user.name,
      rating: ratingNum,
      title: title ? title.trim() : undefined,
      comment: comment.trim(),
      isVerifiedPurchase: hasBought,
      status: 'approved',
      helpfulCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    inMemoryReviews.unshift(newReview);

    if (isDbConnected()) {
      try {
        const created = await ReviewModel.create({
          productId: newReview.productId,
          userId: newReview.userId,
          userName: newReview.userName,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          isVerifiedPurchase: newReview.isVerifiedPurchase,
          status: newReview.status,
          helpfulCount: 0,
        });
        newReview.id = created._id.toString();
      } catch (dbErr: any) {
        console.warn('Review DB creation failed:', dbErr.message);
      }
    }

    // Update product rating
    const prod = inMemoryProducts.find((p) => p.id === productId || p.slug === productId);
    if (prod) {
      const prodReviews = inMemoryReviews.filter((r) => r.productId === productId && r.status === 'approved');
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      prod.ratingAverage = Math.round(avg * 10) / 10;
      prod.reviewCount = prodReviews.length;
    }

    res.status(201).json({
      success: true,
      data: newReview,
      message: 'Thank you! Your review has been published.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Moderate reviews
router.get('/admin/list', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    let reviews: any[] = [];
    if (isDbConnected()) {
      try {
        const dbReviews = await ReviewModel.find().sort({ createdAt: -1 });
        if (dbReviews.length > 0) {
          reviews = dbReviews.map((r) => ({
            id: r._id.toString(),
            productId: r.productId,
            userId: r.userId,
            userName: r.userName,
            userAvatar: r.userAvatar,
            rating: r.rating,
            comment: r.comment,
            isVerifiedPurchase: r.isVerifiedPurchase,
            status: r.status,
            createdAt: r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'Recent',
          }));
        }
      } catch (dbErr) {
        console.warn('DB reviews admin query failed:', dbErr);
      }
    }

    if (reviews.length === 0) {
      reviews = inMemoryReviews;
    }

    res.json({ success: true, data: reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/admin/:id/moderate', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const rev = inMemoryReviews.find((r) => r.id === id);
    if (rev) {
      rev.status = status;
    }

    if (isDbConnected()) {
      try {
        const isOid = mongoose.isValidObjectId(id);
        const query = isOid ? { _id: id } : { id };
        await ReviewModel.findOneAndUpdate(query, { status });
      } catch (dbErr) {
        console.warn('Review moderation DB sync failed:', dbErr);
      }
    }

    res.json({ success: true, message: `Review ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/admin/:id', requireAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idx = inMemoryReviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      inMemoryReviews.splice(idx, 1);
    }

    if (isDbConnected()) {
      try {
        const isOid = mongoose.isValidObjectId(id);
        const query = isOid ? { _id: id } : { id };
        await ReviewModel.findOneAndDelete(query);
      } catch (dbErr) {
        console.warn('Review deletion DB sync failed:', dbErr);
      }
    }

    res.json({ success: true, message: 'Review deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
