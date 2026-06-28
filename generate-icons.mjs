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
  const resBase = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    await resize(SRC, path.join(resBase, folder, 'ic_launcher.png'), size);
    await resize(SRC, path.join(resBase, folder, 'ic_launcher_round.png'), size);
    
    // The foreground icon for adaptive icons should have some padding
    const fgSize = Math.round(size * 0.75);
    const fgPadding = Math.round((size - fgSize) / 2);
    const fgBuffer = await sharp(SRC)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
      
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: fgBuffer, top: fgPadding, left: fgPadding }])
    .png()
    .toFile(path.join(resBase, folder, 'ic_launcher_foreground.png'));
    console.log(`  Foreground: ${folder}/ic_launcher_foreground.png  (${size}×${size})`);
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

  // Shortcuts and notifications go to the general 'drawable' folder or corresponding drawable-port folder
  const drawableFolder = path.join(resBase, 'drawable');
  await resize(SRC, path.join(drawableFolder, 'shortcut_0.png'), 96);
  await resize(SRC, path.join(drawableFolder, 'shortcut_1.png'), 96);
  await resize(SRC, path.join(drawableFolder, 'ic_notification_icon.png'), 48);
  await resize(SRC_HI, path.join(drawableFolder, 'splash.png'), 512); // Overwrite drawable/splash.png rocket icon

  // Splash screen (320×320 for hdpi base — using hi-res source)
  const splashSizes = {
    'drawable-port-mdpi':    240,
    'drawable-port-hdpi':    320,
    'drawable-port-xhdpi':   480,
    'drawable-port-xxhdpi':  640,
    'drawable-port-xxxhdpi': 960,
  };
  for (const [folder, size] of Object.entries(splashSizes)) {
    await resize(SRC_HI, path.join(resBase, folder, 'splash.png'), size);
  }

  console.log('\n✅  Alle Icons erfolgreich generiert!\n');
}

main().catch(err => { console.error(err); process.exit(1); });
