const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/review/today
// Returns all cards where next_review <= NOW
router.get('/today', async (req, res) => {
  try {
    const now = new Date();

    const vocabs = await prisma.vocab.findMany({
      where: {
        review: {
          next_review: {
            lte: now,
          },
        },
      },
      include: {
        review: true,
      },
      orderBy: {
        review: {
          next_review: 'asc',
        },
      },
    });

    // Shuffle the results for variety
    const shuffled = vocabs.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      total: shuffled.length,
      cards: shuffled,
    });
  } catch (error) {
    console.error('Review today error:', error);
    res.status(500).json({ error: 'Failed to fetch review cards', details: error.message });
  }
});

// POST /api/review/answer
// Body: { vocab_id: number, correct: boolean }
router.post('/answer', async (req, res) => {
  try {
    const { vocab_id, correct } = req.body;

    if (vocab_id === undefined || correct === undefined) {
      return res.status(400).json({ error: 'vocab_id and correct are required' });
    }

    const review = await prisma.review.findUnique({
      where: { vocab_id: Number(vocab_id) },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review record not found' });
    }

    let { ease_factor, interval_day, correct_count, wrong_count } = review;

    if (correct) {
      // Anki SM-2 simplified
      interval_day = interval_day * ease_factor;
      ease_factor = Math.min(ease_factor + 0.1, 4.0); // cap at 4.0
      correct_count += 1;
    } else {
      interval_day = 1;
      ease_factor = Math.max(ease_factor - 0.2, 1.3); // floor at 1.3
      wrong_count += 1;
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setTime(nextReview.getTime() + interval_day * 24 * 60 * 60 * 1000);

    const updated = await prisma.review.update({
      where: { vocab_id: Number(vocab_id) },
      data: {
        ease_factor,
        interval_day,
        next_review: nextReview,
        last_review: new Date(),
        correct_count,
        wrong_count,
      },
      include: {
        vocab: true,
      },
    });

    res.json({
      success: true,
      review: updated,
      next_review_in_days: Math.round(interval_day * 10) / 10,
    });
  } catch (error) {
    console.error('Review answer error:', error);
    res.status(500).json({ error: 'Failed to update review', details: error.message });
  }
});

module.exports = router;
