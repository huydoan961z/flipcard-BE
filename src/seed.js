require('dotenv').config();

const prisma = require('./prisma');

const sampleVocab = [
  // N5
  { kanji: '日本語', hiragana: 'にほんご', meaning: 'Japanese language', level: 'N5' },
  { kanji: '水', hiragana: 'みず', meaning: 'water', level: 'N5' },
  { kanji: '山', hiragana: 'やま', meaning: 'mountain', level: 'N5' },
  { kanji: '川', hiragana: 'かわ', meaning: 'river', level: 'N5' },
  { kanji: '木', hiragana: 'き', meaning: 'tree / wood', level: 'N5' },
  { kanji: '火', hiragana: 'ひ', meaning: 'fire', level: 'N5' },
  { kanji: '土', hiragana: 'つち', meaning: 'earth / soil', level: 'N5' },
  { kanji: '金', hiragana: 'かね', meaning: 'money / gold', level: 'N5' },
  { kanji: '人', hiragana: 'ひと', meaning: 'person', level: 'N5' },
  { kanji: '子', hiragana: 'こ', meaning: 'child', level: 'N5' },
  { kanji: '女', hiragana: 'おんな', meaning: 'woman', level: 'N5' },
  { kanji: '男', hiragana: 'おとこ', meaning: 'man', level: 'N5' },
  { kanji: '大', hiragana: 'おお', meaning: 'big / large', level: 'N5' },
  { kanji: '小', hiragana: 'ちい', meaning: 'small / little', level: 'N5' },
  { kanji: '上', hiragana: 'うえ', meaning: 'above / up', level: 'N5' },
  { kanji: '下', hiragana: 'した', meaning: 'below / down', level: 'N5' },
  { kanji: '中', hiragana: 'なか', meaning: 'inside / middle', level: 'N5' },
  { kanji: '食べる', hiragana: 'たべる', meaning: 'to eat', level: 'N5' },
  { kanji: '飲む', hiragana: 'のむ', meaning: 'to drink', level: 'N5' },
  { kanji: '見る', hiragana: 'みる', meaning: 'to see / watch', level: 'N5' },
  // N4
  { kanji: '運動', hiragana: 'うんどう', meaning: 'exercise / sport', level: 'N4' },
  { kanji: '映画', hiragana: 'えいが', meaning: 'movie / film', level: 'N4' },
  { kanji: '音楽', hiragana: 'おんがく', meaning: 'music', level: 'N4' },
  { kanji: '旅行', hiragana: 'りょこう', meaning: 'travel / trip', level: 'N4' },
  { kanji: '料理', hiragana: 'りょうり', meaning: 'cooking / cuisine', level: 'N4' },
  { kanji: '図書館', hiragana: 'としょかん', meaning: 'library', level: 'N4' },
  { kanji: '病院', hiragana: 'びょういん', meaning: 'hospital', level: 'N4' },
  { kanji: '銀行', hiragana: 'ぎんこう', meaning: 'bank', level: 'N4' },
  { kanji: '電話', hiragana: 'でんわ', meaning: 'telephone', level: 'N4' },
  { kanji: '新聞', hiragana: 'しんぶん', meaning: 'newspaper', level: 'N4' },
  // N3
  { kanji: '経験', hiragana: 'けいけん', meaning: 'experience', level: 'N3' },
  { kanji: '関係', hiragana: 'かんけい', meaning: 'relationship / connection', level: 'N3' },
  { kanji: '環境', hiragana: 'かんきょう', meaning: 'environment', level: 'N3' },
  { kanji: '文化', hiragana: 'ぶんか', meaning: 'culture', level: 'N3' },
  { kanji: '科学', hiragana: 'かがく', meaning: 'science', level: 'N3' },
  // N2
  { kanji: '概念', hiragana: 'がいねん', meaning: 'concept / notion', level: 'N2' },
  { kanji: '構造', hiragana: 'こうぞう', meaning: 'structure / construction', level: 'N2' },
  { kanji: '慣習', hiragana: 'かんしゅう', meaning: 'custom / convention', level: 'N2' },
  // N1
  { kanji: '哲学', hiragana: 'てつがく', meaning: 'philosophy', level: 'N1' },
  { kanji: '抽象', hiragana: 'ちゅうしょう', meaning: 'abstraction', level: 'N1' },
];

async function main() {
  console.log('🌱 Seeding database...');

  let count = 0;
  for (const v of sampleVocab) {
    await prisma.vocab.create({
      data: {
        kanji: v.kanji,
        hiragana: v.hiragana,
        meaning: v.meaning,
        level: v.level,
        review: {
          create: {
            ease_factor: 2.5,
            interval_day: 1,
            next_review: new Date(), // Due immediately
          },
        },
      },
    });
    count++;
  }

  console.log(`✅ Seeded ${count} vocab entries`);
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
