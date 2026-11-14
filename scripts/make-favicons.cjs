const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & calculator
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);
  for (let y = 0; y < height; y++) {
    rawData[y * rowLength] = 0; // Filter: None
    rgbaBuffer.copy(rawData, y * rowLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance from point (px, py) to line segment (x1, y1) - (x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Draw the Lucide Activity ECG line onto a square canvas
function renderActivityIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  // Original path in 24x24:
  // (2, 12) -> (4.49, 12) -> (6.84, 3.64... wait:
  // M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2
  // Points:
  // P0: (2, 12)
  // P1: (4.49, 12)
  // P2: (6.89, 3.64) -> let's solve: from 4.49, 12 via curve to (6.89, 3.64) then (9.0, 2.18)
  // Or straight segments connecting the vertices:
  // The vertices of the pulse are:
  // (2.0, 12.0) -> (4.8, 12.0) -> (7.1, 7.8) -> (9.0, 2.2) -> (15.0, 21.8) -> (16.9, 16.2) -> (19.2, 12.0) -> (22.0, 12.0)
  const pts = [
    [2.0, 12.0],
    [4.6, 12.0],
    [6.9, 8.2],
    [9.0, 2.3],
    [15.0, 21.7],
    [17.1, 15.8],
    [19.4, 12.0],
    [22.0, 12.0]
  ];

  const scale = size / 24;
  const strokeWidth = 2.2 * scale;
  const radius = strokeWidth / 2;

  // Blue #2563eb: R=37, G=99, B=235
  const R = 37, G = 99, B = 235;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Map pixel center to 24x24
      const px = (x + 0.5) / scale;
      const py = (y + 0.5) / scale;

      let minDist = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distToSegment(px, py, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
        if (d < minDist) minDist = d;
      }

      // Convert distance to pixel units
      const dPx = minDist * scale;
      let alpha = 0;
      if (dPx <= radius - 0.5) {
        alpha = 1.0;
      } else if (dPx < radius + 0.5) {
        alpha = 1.0 - (dPx - (radius - 0.5));
      }

      if (alpha > 0) {
        const idx = (y * size + x) * 4;
        buf[idx] = R;
        buf[idx + 1] = G;
        buf[idx + 2] = B;
        buf[idx + 3] = Math.round(alpha * 255);
      }
    }
  }

  return buf;
}

function createIco(png32Buf) {
  // 6-byte ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // 1 image

  // 16-byte Directory entry
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2);  // 0 colors (>=256)
  entry.writeUInt8(0, 3);  // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(png32Buf.length, 8); // size of PNG
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([header, entry, png32Buf]);
}

const outDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Generate 32x32 PNG
const rgba32 = renderActivityIcon(32);
const png32 = createPng(32, 32, rgba32);
fs.writeFileSync(path.join(outDir, 'favicon.png'), png32);
console.log('Created public/favicon.png (32x32)');

// 2. Generate favicon.ico wrapping PNG
const ico = createIco(png32);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), ico);
console.log('Created public/favicon.ico');
