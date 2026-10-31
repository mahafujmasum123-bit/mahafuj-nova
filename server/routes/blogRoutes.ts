import { Router, Request, Response } from 'express';
import { ArticleModel, inMemoryArticles } from '../models/Article';
import { isDbConnected } from '../db';

const router = Router();

// Seed initial articles into MongoDB if connected and empty
let articlesSeeded = false;
async function ensureArticlesSeeded() {
  if (articlesSeeded || !isDbConnected()) return;
  try {
    const count = await ArticleModel.countDocuments();
    if (count === 0) {
      for (const a of inMemoryArticles) {
        await ArticleModel.create({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          content: a.content,
          coverImage: a.coverImage,
          category: a.category,
          author: a.author,
          readTimeMinutes: a.readTimeMinutes,
          publishedAt: new Date(a.publishedAt),
          featured: a.featured,
          tags: a.tags,
          viewsCount: a.viewsCount,
        });
      }
    }
    articlesSeeded = true;
  } catch (err: any) {
    console.warn('[Blog] Article seed warning:', err.message);
  }
}

/**
 * GET /api/blog
 * Fetch blog articles with category, tag, search, and featured filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    await ensureArticlesSeeded();

    const { category, tag, search, featured } = req.query;

    let articles: any[] = inMemoryArticles;

    if (isDbConnected()) {
      try {
        const query: any = {};
        if (category && category !== 'all') {
          query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        if (tag) {
          query.tags = tag;
        }
        if (featured === 'true') {
          query.featured = true;
        }
        if (search) {
          const s = String(search).trim();
          query.$or = [
            { title: { $regex: s, $options: 'i' } },
            { excerpt: { $regex: s, $options: 'i' } },
            { tags: { $regex: s, $options: 'i' } },
          ];
        }

        const dbArticles = await ArticleModel.find(query).sort({ publishedAt: -1 }).lean();
        if (dbArticles && dbArticles.length > 0) {
          articles = dbArticles.map((a: any) => ({
            ...a,
            id: a._id ? a._id.toString() : a.id,
          }));
        }
      } catch (err: any) {
        console.warn('[Blog] DB query error, using in-memory articles:', err.message);
      }
    }

    // In-memory filter fallback
    if (category && category !== 'all') {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === String(category).toLowerCase()
      );
    }
    if (tag) {
      articles = articles.filter((a) =>
        a.tags?.some((t: string) => t.toLowerCase() === String(tag).toLowerCase())
      );
    }
    if (featured === 'true') {
      articles = articles.filter((a) => a.featured);
    }
    if (search) {
      const q = String(search).toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      data: articles,
      count: articles.length,
    });
  } catch (err: any) {
    console.error('[Blog List Error]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/blog/:slug
 * Fetch single article by slug and increment views
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    await ensureArticlesSeeded();
    const { slug } = req.params;

    let article = inMemoryArticles.find((a) => a.slug === slug);

    if (isDbConnected()) {
      try {
        const dbArticle = await ArticleModel.findOneAndUpdate(
          { slug },
          { $inc: { viewsCount: 1 } },
          { new: true }
        ).lean();

        if (dbArticle) {
          article = {
            ...dbArticle,
            id: dbArticle._id ? dbArticle._id.toString() : (dbArticle as any).id,
          } as any;
        }
      } catch (err: any) {
        console.warn('[Blog] Single article DB fetch fallback:', err.message);
      }
    } else if (article) {
      article.viewsCount = (article.viewsCount || 0) + 1;
    }

    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }

    // Also find related articles in same category
    const related = inMemoryArticles
      .filter((a) => a.slug !== slug && a.category === article?.category)
      .slice(0, 3);

    res.json({
      success: true,
      data: article,
      related,
    });
  } catch (err: any) {
    console.error('[Blog Single Error]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch article details' });
  }
});

export default router;
