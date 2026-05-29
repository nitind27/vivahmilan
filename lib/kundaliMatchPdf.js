import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const GOLD = '#C8A45C';
const DARK = '#1F2937';
const MUTED = '#6B7280';

const L = {
  en: {
    title: 'Kundali Match Report',
    generated: 'Generated',
    totalGunas: 'Total Gunas',
    compatibility: 'compatibility',
    manglik: 'Manglik',
    groom: 'Groom',
    bride: 'Bride',
    moon: 'Rashi (Moon)',
    nakshatra: 'Nakshatra',
    lagna: 'Lagna',
    yes: 'Yes',
    no: 'No',
    breakdown: 'Ashtakoot Guna Milan Breakdown',
    koota: 'Koota',
    score: 'Score',
    max: 'Max',
    remarks: 'Remarks',
    recommendation: 'Recommendation',
    disclaimer: 'Disclaimer: This report is computer-generated for guidance only. Final marriage decisions should include family consultation and professional astrological review.',
    recExcellent: 'This is an excellent match according to Vedic Ashtakoot principles. Proceed with family consultation and detailed horoscope review by a qualified astrologer.',
    recModerate: 'This match shows moderate to good compatibility. Consider consulting an astrologer for any dosha remedies before finalizing.',
    recLow: 'गुण अंक पारंपरिक सीमा (18) से कम है। विस्तृत कुंडली विश्लेषण और उपाय अत्यंत अनुशंसित।',
  },
  hi: {
    title: 'कुंडली मिलान रिपोर्ट',
    generated: 'निर्माण तिथि',
    totalGunas: 'कुल गुण',
    compatibility: 'अनुकूलता',
    manglik: 'मांगलिक',
    groom: 'वर',
    bride: 'वधू',
    moon: 'राशि (चंद्र)',
    nakshatra: 'नक्षत्र',
    lagna: 'लग्न',
    yes: 'हाँ',
    no: 'नहीं',
    breakdown: 'अष्टकूट गुण मिलान विवरण',
    koota: 'कूट',
    score: 'अंक',
    max: 'अधिकतम',
    remarks: 'टिप्पणी',
    recommendation: 'सिफारिश',
    disclaimer: 'अस्वीकरण: यह रिपोर्ट केवल मार्गदर्शन हेतु कंप्यूटर द्वारा तैयार की गई है। अंतिम निर्णय परिवार परामर्श और योग्य ज्योतिषी की समीक्षा के बाद लें।',
    recExcellent: 'वैदिक अष्टकूट के अनुसार यह उत्तम मिलान है। परिवार परामर्श और विस्तृत कुंडली समीक्षा करें।',
    recModerate: 'यह मिलान मध्यम से अच्छा अनुकूलता दर्शाता है। अंतिम निर्णय से पहले दोष निवारण हेतु ज्योतिषी से सलाह लें।',
    recLow: 'गुण अंक पारंपरिक सीमा (18) से कम है। विस्तृत कुंडली विश्लेषण और उपाय अत्यंत अनुशंसित।',
  },
};

function getFont(doc, lang) {
  if (lang !== 'hi') return 'Helvetica';
  const fontPath = path.join(process.cwd(), 'public/fonts/NotoSansDevanagari-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    doc.registerFont('Devanagari', fontPath);
    return 'Devanagari';
  }
  return 'Helvetica';
}

function drawKootaTable(doc, match, startY, lang, font) {
  const t = L[lang] || L.en;
  let y = startY;
  doc.font(font).fontSize(11).fillColor(DARK).text(t.breakdown, 50, y);
  y += 22;

  const headers = [t.koota, t.score, t.max, t.remarks];
  const colX = [50, 200, 260, 310];
  doc.fontSize(9).fillColor(MUTED);
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 16;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
  y += 8;

  Object.values(match.kootas).forEach((k) => {
    const label = lang === 'hi' ? (k.labelHi || k.label) : k.label;
    doc.fillColor(DARK).fontSize(9).text(label, colX[0], y);
    doc.text(String(k.points), colX[1], y);
    doc.text(String(k.max), colX[2], y);
    doc.fillColor(MUTED).text(k.note || '', colX[3], y, { width: 235 });
    y += 18;
  });

  return y + 10;
}

function drawPersonBlock(doc, title, person, x, y, lang, font) {
  const t = L[lang] || L.en;
  doc.font(font).fontSize(10).fillColor(GOLD).text(title, x, y);
  y += 16;
  const rows = [
    [t.moon, person.rashi],
    [t.nakshatra, person.nakshatra],
    [t.lagna, person.lagna],
    [t.manglik, person.manglik ? t.yes : t.no],
  ];
  doc.fontSize(9).fillColor(DARK);
  rows.forEach(([label, val]) => {
    doc.fillColor(MUTED).text(label, x, y, { continued: false });
    doc.fillColor(DARK).text(String(val), x + 90, y);
    y += 14;
  });
  return y;
}

/**
 * @param {'en'|'hi'} lang
 * @returns {Promise<Buffer>}
 */
export function generateKundaliMatchPdf(match, siteName = 'Milan Matrimony', lang = 'en') {
  const t = L[lang] || L.en;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const font = getFont(doc, lang);
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, doc.page.width, 72).fill(GOLD);
    doc.font(font).fillColor('#FFFFFF').fontSize(lang === 'hi' ? 18 : 22).text(t.title, 50, 28, { align: 'center' });
    doc.fontSize(10).text(siteName, 50, 52, { align: 'center' });

    let y = 90;
    doc.fillColor(MUTED).fontSize(9).text(
      `${t.generated}: ${new Date(match.generatedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
      50, y
    );
    y += 24;

    doc.roundedRect(50, y, 495, 64, 8).fill('#FDF6E3');
    doc.fillColor(DARK).fontSize(28).text(`${match.totalGunas}/${match.maxGunas}`, 70, y + 12);
    doc.fontSize(12).fillColor(MUTED).text(t.totalGunas, 70, y + 44);
    const verdict = lang === 'hi' ? (match.verdictHi || match.verdict) : match.verdict;
    doc.fillColor(DARK).fontSize(16).text(verdict, 200, y + 16);
    doc.fontSize(11).fillColor(MUTED).text(`${match.percentage}% ${t.compatibility}`, 200, y + 38);
    y += 80;

    doc.fontSize(10).fillColor(DARK).text(`${t.manglik}: ${match.manglik.note}`, 50, y);
    y += 28;

    const yAfterGroom = drawPersonBlock(doc, `${t.groom} — ${match.groom.name}`, match.groom, 50, y, lang, font);
    drawPersonBlock(doc, `${t.bride} — ${match.bride.name}`, match.bride, 300, y, lang, font);
    y = Math.max(yAfterGroom, y + 72) + 16;

    y = drawKootaTable(doc, match, y, lang, font);

    doc.fontSize(11).fillColor(DARK).text(t.recommendation, 50, y);
    y += 18;
    const rec = match.totalGunas >= 28 ? t.recExcellent : match.totalGunas >= 18 ? t.recModerate : t.recLow;
    doc.fontSize(9).fillColor(MUTED).text(rec, 50, y, { width: 495, lineGap: 4 });
    y += 60;

    doc.fontSize(8).fillColor(MUTED).text(t.disclaimer, 50, y, { width: 495, align: 'center' });

    doc.end();
  });
}
