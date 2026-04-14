const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/vocab/difficult
// Returns words with most wrong answers
router.get('/difficult', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const vocabs = await prisma.vocab.findMany({
      where: {
        review: {
          wrong_count: {
            gt: 0,
          },
        },
      },
      include: {
        review: true,
      },
      orderBy: {
        review: {
          wrong_count: 'desc',
        },
      },
      take: limit,
    });

    res.json({
      success: true,
      total: vocabs.length,
      vocabs,
    });
  } catch (error) {
    console.error('Difficult vocab error:', error);
    res.status(500).json({ error: 'Failed to fetch difficult vocab', details: error.message });
  }
});

// GET /api/vocab/all
router.get('/all', async (req, res) => {
  try {
    const { level, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = level ? { level } : {};

    const [vocabs, total] = await Promise.all([
      prisma.vocab.findMany({
        where,
        include: { review: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.vocab.count({ where }),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      vocabs,
    });
  } catch (error) {
    console.error('Vocab all error:', error);
    res.status(500).json({ error: 'Failed to fetch vocab', details: error.message });
  }
});

// DELETE /api/vocab/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.vocab.delete({ where: { id } });

    res.json({ success: true, message: 'Vocab deleted' });
  } catch (error) {
    console.error('Vocab delete error:', error);
    res.status(500).json({ error: 'Failed to delete vocab', details: error.message });
  }
});

// GET /api/vocab/stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();

    const [total, dueToday, totalCorrect, totalWrong] = await Promise.all([
      prisma.vocab.count(),
      prisma.review.count({ where: { next_review: { lte: now } } }),
      prisma.review.aggregate({ _sum: { correct_count: true } }),
      prisma.review.aggregate({ _sum: { wrong_count: true } }),
    ]);

    // By level
    const byLevel = await prisma.vocab.groupBy({
      by: ['level'],
      _count: { id: true },
      orderBy: { level: 'asc' },
    });

    res.json({
      success: true,
      stats: {
        total,
        dueToday,
        totalCorrect: totalCorrect._sum.correct_count || 0,
        totalWrong: totalWrong._sum.wrong_count || 0,
        byLevel: byLevel.map(b => ({ level: b.level, count: b._count.id })),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

module.exports = router;
