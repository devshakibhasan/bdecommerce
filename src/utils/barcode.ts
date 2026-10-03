// Code 128B pattern table (values 0-106)
const PATTERNS: string[] = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112"
];

export interface BarcodeResult {
  svg: string;
  totalWidth: number;
  height: number;
}

/**
 * Generate standard Code-128 SVG barcode for thermal printing.
 */
export function generateCode128Svg(text: string, height: number = 50, barWidth: number = 2): BarcodeResult {
  if (!text) {
    return { svg: '', totalWidth: 0, height: 0 };
  }

  // Start Code B is index 104
  const startCode = 104;
  const stopCode = 106;
  
  const codes: number[] = [startCode];
  let checkSum = startCode;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Support ASCII 32 to 126
    const code = Math.max(0, Math.min(94, charCode - 32));
    codes.push(code);
    checkSum += code * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(stopCode);

  let patternStr = "";
  for (const c of codes) {
    if (PATTERNS[c]) {
      patternStr += PATTERNS[c];
    }
  }

  let currentX = 8; // quiet zone
  const rects: string[] = [];

  for (let i = 0; i < patternStr.length; i++) {
    const width = parseInt(patternStr[i], 10) * barWidth;
    if (i % 2 === 0) {
      rects.push(`<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="black" />`);
    }
    currentX += width;
  }

  currentX += 8; // quiet zone
  const totalWidth = currentX;

  const svg = `<svg viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" style="max-width: ${totalWidth}px;" xmlns="http://www.w3.org/2000/svg">
  <rect width="${totalWidth}" height="${height}" fill="white" />
  ${rects.join('\n  ')}
</svg>`;

  return { svg, totalWidth, height };
}
