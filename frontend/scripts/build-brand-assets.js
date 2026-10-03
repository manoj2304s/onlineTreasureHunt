// Builds the Expo icon + splash asset set from the two brand PNGs.
// Quality notes: resampling is done on PREMULTIPLIED alpha (no dark fringes on
// transparent art), with a Catmull-Rom kernel whose radius widens when minifying
// (proper area averaging). After an upscale the alpha edge is re-contrasted so the
// hard-edged vector-style art stays crisp instead of going soft.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Source artwork lives in assets/brand; generated icons land in assets/images.
// Regenerate with:  npm run build:brand
const SRC = process.env.BRAND_SRC || path.join(__dirname, '..', 'assets', 'brand');
const OUT = process.argv[2] || path.join(__dirname, '..', 'assets', 'images');
const MARK = 'mark.png';        // blue wave mark -> app icon
const LOCKUP = 'lockup.png';    // Science Association lockup -> splash
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

function load(file) {
  const p = PNG.sync.read(fs.readFileSync(path.join(SRC, file)));
  const n = p.width * p.height;
  const d = new Float64Array(n * 4);
  for (let i = 0; i < n * 4; i += 4) {
    const a = p.data[i + 3] / 255;
    d[i] = p.data[i] * a; d[i + 1] = p.data[i + 1] * a; d[i + 2] = p.data[i + 2] * a; d[i + 3] = a;
  }
  return { w: p.width, h: p.height, d };
}

function bbox(img, thr = 8 / 255) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.d[((y * img.w + x) << 2) + 3] > thr) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const catrom = (x) => {
  x = Math.abs(x);
  if (x < 1) return 1.5 * x ** 3 - 2.5 * x ** 2 + 1;
  if (x < 2) return -0.5 * x ** 3 + 2.5 * x ** 2 - 4 * x + 2;
  return 0;
};

// separable resample of a crop region into dw x dh
function resample(img, crop, dw, dh) {
  const pass = (src, sw, sh, dstW, srcX, horiz) => {
    const out = new Float64Array(dstW * (horiz ? sh : sw) * 4);
    const scale = dstW / (horiz ? crop.w : crop.h);
    const fs_ = scale < 1 ? 1 / scale : 1;     // widen kernel when minifying
    const r = 2 * fs_;
    const lines = horiz ? sh : sw;
    for (let o = 0; o < dstW; o++) {
      const center = (o + 0.5) / scale + srcX - 0.5;
      const i0 = Math.ceil(center - r), i1 = Math.floor(center + r);
      const idx = [], wt = [];
      let wsum = 0;
      for (let i = i0; i <= i1; i++) {
        const w = catrom((i - center) / fs_);
        if (w === 0) continue;
        idx.push(clamp(i, 0, (horiz ? sw : sh) - 1)); wt.push(w); wsum += w;
      }
      for (let l = 0; l < lines; l++) {
        let r0 = 0, g0 = 0, b0 = 0, a0 = 0;
        for (let k = 0; k < idx.length; k++) {
          const si = horiz ? ((l * sw + idx[k]) << 2) : ((idx[k] * sw + l) << 2);
          const w = wt[k];
          r0 += src[si] * w; g0 += src[si + 1] * w; b0 += src[si + 2] * w; a0 += src[si + 3] * w;
        }
        const di = horiz ? ((l * dstW + o) << 2) : ((o * sw + l) << 2);
        out[di] = r0 / wsum; out[di + 1] = g0 / wsum; out[di + 2] = b0 / wsum; out[di + 3] = a0 / wsum;
      }
    }
    return out;
  };
  const h1 = pass(img.d, img.w, img.h, dw, crop.x, true);          // dw x img.h
  const v1 = pass(h1, dw, img.h, dh, crop.y, false);               // dw x dh
  return { w: dw, h: dh, d: v1 };
}

// restore a crisp ~1px alpha edge after upscaling
function sharpenAlpha(img, factor) {
  if (factor <= 1.05) return img;
  const k = clamp(factor / 1.15, 1, 6);
  for (let i = 0; i < img.d.length; i += 4) {
    const a = img.d[i + 3];
    if (a <= 0.003) { img.d[i] = img.d[i + 1] = img.d[i + 2] = 0; img.d[i + 3] = 0; continue; }
    const r = img.d[i] / a, g = img.d[i + 1] / a, b = img.d[i + 2] / a;   // un-premultiply
    const na = clamp((a - 0.5) * k + 0.5, 0, 1);
    img.d[i] = r * na; img.d[i + 1] = g * na; img.d[i + 2] = b * na; img.d[i + 3] = na;
  }
  return img;
}

// canvas ops -------------------------------------------------------------
const canvas = (w, h, bg) => {
  const d = new Float64Array(w * h * 4);
  if (bg) for (let i = 0; i < d.length; i += 4) {
    d[i] = bg[0]; d[i + 1] = bg[1]; d[i + 2] = bg[2]; d[i + 3] = 1;
  }
  return { w, h, d };
};
function stamp(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    const dy = y + oy; if (dy < 0 || dy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) {
      const dx = x + ox; if (dx < 0 || dx >= dst.w) continue;
      const s = (y * src.w + x) << 2, o = (dy * dst.w + dx) << 2;
      const a = src.d[s + 3];
      for (let k = 0; k < 3; k++) dst.d[o + k] = src.d[s + k] + dst.d[o + k] * (1 - a);
      dst.d[o + 3] = a + dst.d[o + 3] * (1 - a);
    }
  }
}
function tint(img, col) {   // keep alpha, replace colour (for the monochrome/dark variants)
  for (let i = 0; i < img.d.length; i += 4) {
    const a = img.d[i + 3];
    img.d[i] = col[0] * a; img.d[i + 1] = col[1] * a; img.d[i + 2] = col[2] * a;
  }
  return img;
}
function write(name, img) {
  const png = new PNG({ width: img.w, height: img.h });
  for (let i = 0; i < img.d.length; i += 4) {
    const a = clamp(img.d[i + 3], 0, 1);
    for (let k = 0; k < 3; k++) {
      png.data[i + k] = Math.round(clamp(a > 0 ? img.d[i + k] / a : 0, 0, 255));  // un-premultiply
    }
    png.data[i + 3] = Math.round(a * 255);
  }
  const p = path.join(OUT, name);
  fs.writeFileSync(p, PNG.sync.write(png));
  console.log(`${name.padEnd(30)} ${img.w}x${img.h}  ${(fs.statSync(p).size / 1024).toFixed(1)} KB`);
}

// fit `img` into a square canvas so its LONGEST side spans `frac` of it
function fitted(img, crop, size, frac) {
  const s = (size * frac) / Math.max(crop.w, crop.h);
  const dw = Math.round(crop.w * s), dh = Math.round(crop.h * s);
  return sharpenAlpha(resample(img, crop, dw, dh), s);
}

const WHITE = [255, 255, 255];
fs.mkdirSync(OUT, { recursive: true });

// --- app icon, from the blue mark -------------------------------------
const mark = load(MARK), mb = bbox(mark);

const iconArt = fitted(mark, mb, 1024, 0.66);
const icon = canvas(1024, 1024, WHITE);
stamp(icon, iconArt, (1024 - iconArt.w) >> 1, (1024 - iconArt.h) >> 1);
write('icon.png', icon);

// Android foreground: inside the 66% safe zone (a 1.7:1 mark at 0.50 clears it)
const advArt = fitted(mark, mb, 1024, 0.50);
const adaptive = canvas(1024, 1024, null);
stamp(adaptive, advArt, (1024 - advArt.w) >> 1, (1024 - advArt.h) >> 1);
write('adaptive-icon.png', adaptive);

const monoArt = tint(fitted(mark, mb, 1024, 0.50), WHITE);
const mono = canvas(1024, 1024, null);
stamp(mono, monoArt, (1024 - monoArt.w) >> 1, (1024 - monoArt.h) >> 1);
write('adaptive-icon-monochrome.png', mono);

const favArt = fitted(mark, mb, 96, 0.82);
const fav = canvas(96, 96, WHITE);
stamp(fav, favArt, (96 - favArt.w) >> 1, (96 - favArt.h) >> 1);
write('favicon.png', fav);

// --- splash, from the Science Association lockup ----------------------
const logo = load(LOCKUP), lb = bbox(logo);
const sw = lb.w * 2, sh = Math.round(lb.h * (sw / lb.w));      // 2x for high-density screens
const splash = sharpenAlpha(resample(logo, lb, sw, sh), 2);
write('splash-icon.png', splash);
write('splash-icon-dark.png', tint(sharpenAlpha(resample(logo, lb, sw, sh), 2), WHITE));
