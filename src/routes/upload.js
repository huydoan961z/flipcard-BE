const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../prisma');

const router = express.Router();

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Skip header row - allow 2 or more columns (kanji, hiragana are mandatory)
    const rows = rawData.slice(1).filter(row => row.length >= 2);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found in Excel file' });
    }

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      let [kanji, hiragana, meaning, level] = row.map(cell =>
        cell !== undefined && cell !== null ? String(cell).trim() : ''
      );

      // Nếu thiếu level hoặc level trống, tự động gán N3
      if (!level) {
        level = 'N3';
      }

      if (!kanji || !hiragana) {
        skipped++;
        continue;
      }

      const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
      const normalizedLevel = level.toUpperCase();
      if (!validLevels.includes(normalizedLevel)) {
        skipped++;
        continue;
      }

      // Logic kiểm tra trùng lặp linh hoạt
      let existing = null;
      if (kanji) {
        existing = await prisma.vocab.findFirst({ where: { kanji: kanji } });
      } else {
        // Nếu không có Kanji, kiểm tra dựa trên Hiragana (với điều kiện bản ghi đó cũng không có Kanji)
        existing = await prisma.vocab.findFirst({
          where: { kanji: '', hiragana: hiragana }
        });
      }

      if (existing) {
        // Cập nhật bản ghi cũ
        await prisma.vocab.update({
          where: { id: existing.id },
          data: {
            hiragana,
            meaning,
            level: normalizedLevel,
          }
        });
      } else {
        // Tạo bản ghi mới
        await prisma.vocab.create({
          data: {
            kanji,
            hiragana,
            meaning,
            level: normalizedLevel,
            review: {
              create: {
                ease_factor: 2.5,
                interval_day: 1,
                next_review: new Date(),
              },
            },
          },
        });
      }

      created++;
    }

    res.json({
      success: true,
      message: `Imported ${created} vocab(s). Skipped ${skipped} invalid row(s).`,
      created,
      skipped,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
});

module.exports = router;
