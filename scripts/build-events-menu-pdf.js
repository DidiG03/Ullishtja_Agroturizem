const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const sharp = require('sharp');

const MENU_DIR = path.join(__dirname, '../public/images/image_menu');
const OUTPUT = path.join(MENU_DIR, 'events-menu.pdf');

async function main() {
  const files = fs
    .readdirSync(MENU_DIR)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    throw new Error(`No images found in ${MENU_DIR}`);
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i += 1) {
    if (i > 0) pdf.addPage();

    const image = sharp(path.join(MENU_DIR, files[i])).rotate();
    const meta = await image.metadata();
    const jpeg = await image.jpeg({ quality: 85 }).toBuffer();
    const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;

    const imgRatio = meta.width / meta.height;
    const pageRatio = pageW / pageH;
    let width;
    let height;
    let x;
    let y;
    if (imgRatio > pageRatio) {
      width = pageW;
      height = pageW / imgRatio;
      x = 0;
      y = (pageH - height) / 2;
    } else {
      height = pageH;
      width = pageH * imgRatio;
      x = (pageW - width) / 2;
      y = 0;
    }

    pdf.addImage(dataUrl, 'JPEG', x, y, width, height);
  }

  fs.writeFileSync(OUTPUT, Buffer.from(pdf.output('arraybuffer')));
  console.log(`Wrote ${OUTPUT} (${files.length} pages: ${files.join(', ')})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
