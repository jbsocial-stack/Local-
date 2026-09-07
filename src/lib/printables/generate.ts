import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

// R12: "auto-generated A4 poster + window sticker PDF per merchant with
// town QR and merchant name." The QR goes straight to the town's Add-to-
// Wallet landing page (open question #7's recommendation — the directory
// is linked from the pass back field instead, per R8/R9).
const CORAL = rgb(0xf7 / 255, 0x6c / 255, 0x5e / 255);
const CREAM = rgb(0xf3 / 255, 0xf1 / 255, 0xec / 255);
const INK = rgb(0x1b / 255, 0x26 / 255, 0x3b / 255);

async function embedLogoFont(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const bytes = await readFile(path.join(process.cwd(), 'public/fonts/windsor-pro-bold.ttf'));
  return pdf.embedFont(bytes);
}

async function embedQr(pdf: PDFDocument, url: string) {
  const png = await QRCode.toBuffer(url, { margin: 1, width: 600, color: { dark: '#1a1a1a', light: '#ffffffff' } });
  return pdf.embedPng(png);
}

function joinUrl(appOrigin: string, townSlug: string): string {
  return `${appOrigin}/${townSlug}`;
}

export async function generatePosterPdf(input: {
  merchantName: string;
  townSlug: string;
  appOrigin: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait, points
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await embedLogoFont(pdf);

  page.drawRectangle({ x: 0, y: 0, width, height, color: CREAM });
  page.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: CORAL });

  page.drawText('REGULARS', {
    x: 48,
    y: height - 95,
    size: 56,
    font: logo,
    color: rgb(1, 1, 1),
  });
  page.drawText('Get Regular. Eat, shop and earn points in your town.', {
    x: 48,
    y: height - 125,
    size: 16,
    font: regular,
    color: rgb(1, 1, 1),
  });

  page.drawText(input.merchantName, {
    x: 48,
    y: height - 200,
    size: 28,
    font: bold,
    color: INK,
    maxWidth: width - 96,
  });
  page.drawText('is part of the scheme — scan to join and start earning today.', {
    x: 48,
    y: height - 230,
    size: 15,
    font: regular,
    color: INK,
    maxWidth: width - 96,
  });

  const qr = await embedQr(pdf, joinUrl(input.appOrigin, input.townSlug));
  const qrSize = 320;
  page.drawImage(qr, {
    x: (width - qrSize) / 2,
    y: 220,
    width: qrSize,
    height: qrSize,
  });

  page.drawText('No app to download — adds straight to your phone wallet.', {
    x: 48,
    y: 160,
    size: 13,
    font: regular,
    color: INK,
    maxWidth: width - 96,
  });

  return pdf.save();
}

export async function generateStickerPdf(input: {
  merchantName: string;
  townSlug: string;
  appOrigin: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const size = 297.6; // ~105mm square, a standard window-sticker size
  const page = pdf.addPage([size, size]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await embedLogoFont(pdf);

  page.drawRectangle({ x: 0, y: 0, width: size, height: size, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 6, y: 6, width: size - 12, height: size - 12, borderColor: CORAL, borderWidth: 3 });

  page.drawText('REGULARS', { x: 24, y: size - 40, size: 26, font: logo, color: CORAL });
  page.drawText(input.merchantName, {
    x: 24,
    y: size - 58,
    size: 11,
    font: regular,
    color: INK,
    maxWidth: size - 48,
  });

  const qr = await embedQr(pdf, joinUrl(input.appOrigin, input.townSlug));
  const qrSize = size - 90;
  page.drawImage(qr, { x: (size - qrSize) / 2, y: 40, width: qrSize, height: qrSize });

  page.drawText('Scan to join', {
    x: (size - regular.widthOfTextAtSize('Scan to join', 12)) / 2,
    y: 22,
    size: 12,
    font: regular,
    color: INK,
  });

  return pdf.save();
}
