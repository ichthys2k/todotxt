// generate-icons.mjs
//
// Generates all platform-specific icon assets from a single high-res source.
// Source: icons/3.png
//
// Targets: Web/PWA, Android (mipmap, drawable), Electron, Store
//
// Usage: node generate-icons.mjs

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source icon
const SRC = path.join(__dirname, 'icons', '3.png');
const SRC_HI = SRC;

async function resize(src, outPath, width, height) {
  height = height || width;
  await sharp(src)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`  ✅  ${path.relative(__dirname, outPath)}  (${width}×${height})`);
}

async function main() {
  console.log('\n🎨  Generiere Icons aus icons/2.png …\n');

  // ── Web / PWA ──────────────────────────────────────────────────────────────
  console.log('── Web / PWA ──');
  await resize(SRC, path.join(__dirname, 'public', 'favicon.png'), 48);
  await resize(SRC, path.join(__dirname, 'public', 'pwa-192x192.png'), 192);
  await resize(SRC, path.join(__dirname, 'public', 'pwa-512x512.png'), 512);

  // Apple touch icon (180×180)
  await resize(SRC, path.join(__dirname, 'public', 'apple-touch-icon.png'), 180);

  // ── Electron ───────────────────────────────────────────────────────────────
  console.log('\n── Electron ──');
  await resize(SRC, path.join(__dirname, 'public', 'icon.png'), 256);

  // ── Store icon ─────────────────────────────────────────────────────────────
  console.log('\n── Store ──');
  await resize(SRC, path.join(__dirname, 'store_icon.png'), 512);

  // ── Android mipmap (launcher icon) ─────────────────────────────────────────
  console.log('\n── Android mipmap (ic_launcher) ──');
  const mipmapSizes = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
  };
  const resBase = path.join(__dirname, 'app', 'src', 'main', 'res');

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    await resize(SRC, path.join(resBase, folder, 'ic_launcher.png'), size);
  }

  // ── Android mipmap (maskable icon — larger safe zone) ──────────────────────
  console.log('\n── Android mipmap (ic_maskable) ──');
  const maskableSizes = {
    'mipmap-mdpi':    48,
    'mipmap-hdpi':    72,
    'mipmap-xhdpi':   96,
    'mipmap-xxhdpi':  144,
    'mipmap-xxxhdpi': 192,
  };

  for (const [folder, size] of Object.entries(maskableSizes)) {
    // For maskable icons, add padding (icon in 80% of canvas, centered on green bg)
    const iconSize = Math.round(size * 0.7);
    const padding = Math.round((size - iconSize) / 2);

    const iconBuffer = await sharp(SRC)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 76, g: 175, b: 125, alpha: 255 } // #4CAF7D — matches the green from your icon
      }
    })
    .composite([{ input: iconBuffer, top: padding, left: padding }])
    .png()
    .toFile(path.join(resBase, folder, 'ic_maskable.png'));

    console.log(`  ✅  ${folder}/ic_maskable.png  (${size}×${size})`);
  }

  // ── Android drawable (shortcuts + splash + notification) ───────────────────
  console.log('\n── Android drawable (shortcuts, splash, notification) ──');
  const drawableSizes = {
    'drawable-mdpi':    48,
    'drawable-hdpi':    72,
    'drawable-xhdpi':   96,
    'drawable-xxhdpi':  144,
    'drawable-xxxhdpi': 192,
  };

  for (const [folder, size] of Object.entries(drawableSizes)) {
    const folderPath = path.join(resBase, folder);
    // Shortcut icons (same icon for both shortcuts)
    await resize(SRC, path.join(folderPath, 'shortcut_0.png'), size);
    await resize(SRC, path.join(folderPath, 'shortcut_1.png'), size);
  }

  // Splash screen (320×320 for hdpi base — using hi-res source)
  const splashSizes = {
    'drawable-mdpi':    240,
    'drawable-hdpi':    320,
    'drawable-xhdpi':   480,
    'drawable-xxhdpi':  640,
    'drawable-xxxhdpi': 960,
  };
  for (const [folder, size] of Object.entries(splashSizes)) {
    await resize(SRC_HI, path.join(resBase, folder, 'splash.png'), size);
  }

  // Notification icon (white silhouette is ideal, but for now use the icon scaled down)
  const notifSizes = {
    'drawable-mdpi':    24,
    'drawable-hdpi':    36,
    'drawable-xhdpi':   48,
    'drawable-xxhdpi':  72,
    'drawable-xxxhdpi': 96,
  };
  for (const [folder, size] of Object.entries(notifSizes)) {
    await resize(SRC, path.join(resBase, folder, 'ic_notification_icon.png'), size);
  }

  console.log('\n✅  Alle Icons erfolgreich generiert!\n');
}

main().catch(err => { console.error(err); process.exit(1); });
