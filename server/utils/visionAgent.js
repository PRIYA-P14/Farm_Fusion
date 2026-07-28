/**
 * Vision Agent — Real pixel-level soil image analysis using Sharp
 * No external vision API required.
 * Analyses: dominant colour, brightness, texture, moisture, organic matter,
 *           surface condition, soil type — all from actual pixel measurements.
 */
const sharp = require('sharp');

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Compute Laplacian variance (texture sharpness) from raw greyscale pixels */
function laplacianVariance(grey, w, h) {
  let sum = 0, count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = -grey[i - w - 1] - grey[i - w] - grey[i - w + 1]
                  - grey[i - 1]    + 8 * grey[i] - grey[i + 1]
                  - grey[i + w - 1] - grey[i + w] - grey[i + w + 1];
      sum += lap * lap;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

/** Compute edge density using simple Sobel on greyscale pixels */
function edgeDensity(grey, w, h) {
  let edges = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -grey[i - w - 1] + grey[i - w + 1]
                 - 2 * grey[i - 1] + 2 * grey[i + 1]
                 - grey[i + w - 1] + grey[i + w + 1];
      const gy = -grey[i - w - 1] - 2 * grey[i - w] - grey[i - w + 1]
                 + grey[i + w - 1] + 2 * grey[i + w] + grey[i + w + 1];
      if (Math.sqrt(gx * gx + gy * gy) > 40) edges++;
    }
  }
  return edges / ((w - 2) * (h - 2));
}

/** RGB → HSV (H: 0-360, S: 0-1, V: 0-1) */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r)      h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: max > 0 ? d / max : 0, v: max };
}

/** Map mean HSV + RGB to a soil colour label */
function classifyColour(h, s, v, r, g, b) {
  // v is 0-1 here
  if (v < 0.20)                              return 'Black';
  if (v > 0.85 && s < 0.15)                 return 'White';
  if (v > 0.75 && s < 0.20)                 return 'Pale Grey';
  if (h >= 200 && h < 260 && s > 0.15)      return 'Grey';
  if ((h < 15 || h >= 345) && s > 0.45)     return v > 0.55 ? 'Bright Red' : 'Red';
  if ((h < 15 || h >= 345) && s > 0.20)     return v > 0.40 ? 'Reddish Brown' : 'Dark Reddish Brown';
  if (h >= 15 && h < 35 && s > 0.35)        return v > 0.55 ? 'Red Orange' : 'Reddish Brown';
  if (h >= 15 && h < 35)                    return v > 0.45 ? 'Brown' : 'Dark Brown';
  if (h >= 35 && h < 55 && s > 0.30)        return v > 0.65 ? 'Pale Yellow' : 'Dark Yellow Brown';
  if (h >= 35 && h < 55)                    return v > 0.45 ? 'Light Brown' : 'Dark Brown';
  if (h >= 55 && h < 100)                   return 'Olive Brown';
  if (v < 0.38)                             return 'Dark Brown';
  if (v < 0.58)                             return 'Brown';
  return 'Light Brown';
}

/** Compute mean RGB from raw RGBA/RGB pixel buffer */
function meanRGB(raw, channels) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < raw.length; i += channels) {
    r += raw[i]; g += raw[i + 1]; b += raw[i + 2]; n++;
  }
  return { r: r / n, g: g / n, b: b / n };
}

/** Build greyscale array from raw RGBA/RGB buffer */
function toGrey(raw, channels) {
  const grey = new Float32Array(raw.length / channels);
  for (let i = 0, j = 0; i < raw.length; i += channels, j++) {
    grey[j] = 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2];
  }
  return grey;
}

/** Compute std-dev of greyscale array */
function stdDev(grey) {
  const mean = grey.reduce((a, v) => a + v, 0) / grey.length;
  const variance = grey.reduce((a, v) => a + (v - mean) ** 2, 0) / grey.length;
  return Math.sqrt(variance);
}

/** Fraction of pixels darker than threshold (moisture / organic matter proxy) */
function darkFraction(grey, threshold) {
  let count = 0;
  for (let i = 0; i < grey.length; i++) if (grey[i] < threshold) count++;
  return count / grey.length;
}

/** Fraction of pixels brighter than threshold (stone / salt proxy) */
function brightFraction(grey, threshold) {
  let count = 0;
  for (let i = 0; i < grey.length; i++) if (grey[i] > threshold) count++;
  return count / grey.length;
}

// ── Confidence calculator ─────────────────────────────────────────────────────
/**
 * Confidence is based on how "soil-like" the image looks:
 * - Soil colours (brown, red, dark) → high confidence
 * - Very bright / very uniform → lower confidence
 * - Reasonable texture variance → higher confidence
 */
function computeConfidence(colourLabel, lapVar, edgeDens, brightness, uniformity) {
  let score = 50;

  // Colour match
  const soilColours = ['black', 'dark brown', 'brown', 'reddish brown', 'red', 'olive brown',
                       'dark yellow brown', 'dark reddish brown', 'red orange', 'bright red'];
  const nonSoilColours = ['white', 'pale grey', 'grey'];
  const lc = colourLabel.toLowerCase();
  if (soilColours.some(c => lc.includes(c)))    score += 25;
  else if (nonSoilColours.some(c => lc === c))  score -= 20;
  else                                           score += 10;

  // Texture variance (soil has moderate-high texture)
  if (lapVar > 50 && lapVar < 5000)   score += 15;
  else if (lapVar < 10)               score -= 15; // too smooth = not soil
  else if (lapVar > 10000)            score -= 10; // too noisy = not soil

  // Edge density (soil has moderate edges)
  if (edgeDens > 0.03 && edgeDens < 0.35) score += 10;
  else if (edgeDens < 0.01)               score -= 10;

  // Brightness (soil is usually not very bright)
  if (brightness < 0.75)  score += 5;
  else                    score -= 10;

  // Uniformity (very uniform = possibly not soil)
  if (uniformity > 15 && uniformity < 80) score += 5;
  else if (uniformity < 8)                score -= 10;

  return clamp(Math.round(score), 30, 97);
}

// ── Main Analysis ─────────────────────────────────────────────────────────────

async function analyseImageWithVision(imageBuffer) {
  try {
    // Resize to 300×300 for consistent, fast analysis
    const W = 300, H = 300;
    const { data: raw, info } = await sharp(imageBuffer)
      .resize(W, H, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const ch = info.channels; // 3 (RGB) or 4 (RGBA)

    // ── Mean colour ──────────────────────────────────────────────────────────
    const { r, g, b } = meanRGB(raw, ch);
    const hsv = rgbToHsv(r, g, b);
    const colourLabel = classifyColour(hsv.h, hsv.s, hsv.v, r, g, b);
    const colourHex = '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

    // ── Greyscale metrics ────────────────────────────────────────────────────
    const grey = toGrey(raw, ch);
    const brightness = hsv.v;                          // 0-1
    const uniformity = stdDev(grey);                   // 0-255
    const lapVar     = laplacianVariance(grey, W, H);  // texture
    const edgeDens   = edgeDensity(grey, W, H);        // 0-1
    const darkPx     = darkFraction(grey, 80);         // moisture proxy
    const veryDarkPx = darkFraction(grey, 55);         // organic matter proxy
    const brightPx   = brightFraction(grey, 210);      // stone/salt proxy

    // ── Brightness level ─────────────────────────────────────────────────────
    const brightnessLevel =
      brightness < 0.22 ? 'Very Dark' :
      brightness < 0.38 ? 'Dark' :
      brightness < 0.57 ? 'Medium' :
      brightness < 0.75 ? 'Light' : 'Very Light';

    // ── Texture label ────────────────────────────────────────────────────────
    const texture =
      lapVar < 60   ? 'Fine' :
      lapVar < 250  ? 'Medium' :
      lapVar < 900  ? 'Coarse' : 'Gritty';

    // ── Moisture label ───────────────────────────────────────────────────────
    const moisture =
      darkPx > 0.50 ? 'Wet' :
      darkPx > 0.32 ? 'Moist' :
      darkPx > 0.14 ? 'Moderate' : 'Dry';

    // ── Organic matter label ─────────────────────────────────────────────────
    const organicMatter =
      veryDarkPx > 0.38 ? 'High' :
      veryDarkPx > 0.14 ? 'Moderate' : 'Low';

    // ── Surface condition ────────────────────────────────────────────────────
    // High edge density + low uniformity = cracked; very smooth = compacted
    const surfaceCondition =
      edgeDens > 0.22 && uniformity > 55 ? 'Cracked' :
      uniformity < 18                    ? 'Smooth' :
      uniformity > 72                    ? 'Loose' :
      edgeDens > 0.12                    ? 'Granular' : 'Compacted';

    // ── Estimated soil type from colour + texture ────────────────────────────
    const lc = colourLabel.toLowerCase();
    let estimatedSoilType;
    if (lc.includes('black'))                                    estimatedSoilType = 'Black Cotton';
    else if (lc.includes('bright red') || lc.includes('red orange')) estimatedSoilType = 'Laterite';
    else if (lc.includes('red'))                                 estimatedSoilType = 'Red';
    else if (lc.includes('pale yellow') || lc.includes('pale grey')) estimatedSoilType = 'Sandy';
    else if (lc.includes('grey'))                                estimatedSoilType = 'Alluvial';
    else if (texture === 'Fine' || texture === 'Medium') {
      estimatedSoilType = lc.includes('dark') ? 'Clay Loam' : 'Loamy';
    } else if (texture === 'Coarse' || texture === 'Gritty') {
      estimatedSoilType = 'Sandy Loam';
    } else {
      estimatedSoilType = 'Loamy';
    }

    // ── Per-property confidence scores ───────────────────────────────────────
    // Each score reflects how clearly that property can be read from pixels
    const overallConf = computeConfidence(colourLabel, lapVar, edgeDens, brightness, uniformity);

    // Colour confidence: higher when saturation is clear
    const colourConf  = clamp(Math.round(overallConf * (0.85 + hsv.s * 0.20)), 30, 97);
    // Texture confidence: higher when lapVar is in a clear range
    const textureConf = clamp(Math.round(overallConf * (lapVar > 30 && lapVar < 3000 ? 0.95 : 0.75)), 30, 95);
    // Moisture confidence: higher when darkPx is clearly high or low
    const moistureConf = clamp(Math.round(overallConf * (darkPx > 0.45 || darkPx < 0.10 ? 0.95 : 0.82)), 30, 95);
    // Organic matter confidence: driven by very dark pixel fraction
    const omConf      = clamp(Math.round(overallConf * (veryDarkPx > 0.30 || veryDarkPx < 0.08 ? 0.92 : 0.78)), 30, 93);
    // Soil type confidence: derived from colour + texture combination
    const soilTypeConf = clamp(Math.round(overallConf * 0.88), 30, 92);

    // ── Visual observations text ─────────────────────────────────────────────
    const visualObservations =
      `The soil appears ${colourLabel.toLowerCase()} with ${texture.toLowerCase()} texture and ${moisture.toLowerCase()} moisture. ` +
      `Surface condition is ${surfaceCondition.toLowerCase()} with ${organicMatter.toLowerCase()} organic matter visibility. ` +
      `Estimated soil type is ${estimatedSoilType} based on colour and texture analysis.`;

    console.log(`[VisionAgent] colour=${colourLabel} hex=${colourHex} texture=${texture} moisture=${moisture} om=${organicMatter} soilType=${estimatedSoilType} conf=${overallConf}`);

    return {
      available:          true,
      soilColour:         colourLabel,
      colourHex,
      colourConfidence:   colourConf,
      texture,
      textureConfidence:  textureConf,
      moisture,
      moistureConfidence: moistureConf,
      organicMatter,
      organicConfidence:  omConf,
      estimatedSoilType,
      soilTypeConfidence: soilTypeConf,
      surfaceCondition,
      brightnessLevel,
      visualObservations,
      confidence:         overallConf,
      // Raw CV metrics (useful for debugging / Groq prompt)
      _cv: {
        brightness:   parseFloat(brightness.toFixed(3)),
        lapVariance:  parseFloat(lapVar.toFixed(1)),
        edgeDensity:  parseFloat(edgeDens.toFixed(4)),
        uniformity:   parseFloat(uniformity.toFixed(1)),
        darkFraction: parseFloat(darkPx.toFixed(3)),
        omDarkFrac:   parseFloat(veryDarkPx.toFixed(3)),
        stonePct:     parseFloat((brightPx * 100).toFixed(1)),
        meanR: Math.round(r), meanG: Math.round(g), meanB: Math.round(b),
      },
    };

  } catch (err) {
    console.error('[VisionAgent] sharp error:', err.message);
    return { available: false, rejected: false, reason: err.message };
  }
}

module.exports = { analyseImageWithVision };
