import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const KEYSTORE_PATH = path.join(__dirname, 'android.keystore');
const KEYSTORE_PASSWORD = 'todotxtpass2026';
const ALIAS = 'android';

// SDK / JDK Paths from Bubblewrap environment
const JAVA_EXE = 'C:\\Users\\corne\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\java.exe';
const JARSIGNER_EXE = 'C:\\Users\\corne\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\jarsigner.exe';
const ZIPALIGN_EXE = 'C:\\Users\\corne\\.bubblewrap\\android_sdk\\build-tools\\34.0.0\\zipalign.exe';
const APKSIGNER_JAR = 'C:\\Users\\corne\\.bubblewrap\\android_sdk\\build-tools\\34.0.0\\lib\\apksigner.jar';

// Source Files
const SRC_APK = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
const SRC_AAB = path.join(__dirname, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

// Target Files
const TEMP_ALIGNED_APK = path.join(__dirname, 'app-release-unsigned-aligned.apk');
const OUT_SIGNED_APK = path.join(__dirname, 'app-release-signed.apk');
const OUT_SIGNED_AAB = path.join(__dirname, 'app-release-bundle.aab');

function run(cmd, args, description) {
  console.log(`\n🚀  Running: ${description}...`);
  console.log(`👉  Command: ${cmd} ${args.map(a => a.includes(' ') || a.includes('?') ? `"${a}"` : a).join(' ')}`);
  
  const result = spawnSync(cmd, args, { stdio: 'inherit', encoding: 'utf-8' });
  if (result.status !== 0) {
    console.error(`❌  Failed: ${description} (exit code ${result.status})`);
    if (result.error) console.error(result.error);
    process.exit(1);
  }
  console.log(`✅  Success: ${description}`);
}

async function main() {
  // 1. Zipalign the unsigned APK
  if (!fs.existsSync(SRC_APK)) {
    console.error(`❌  Source APK not found at: ${SRC_APK}`);
    process.exit(1);
  }

  // Delete temp aligned file if exists
  if (fs.existsSync(TEMP_ALIGNED_APK)) {
    fs.unlinkSync(TEMP_ALIGNED_APK);
  }

  run(
    ZIPALIGN_EXE,
    ['-f', '-v', '4', SRC_APK, TEMP_ALIGNED_APK],
    'Aligning APK'
  );

  // 2. Sign APK using apksigner
  if (fs.existsSync(OUT_SIGNED_APK)) {
    fs.unlinkSync(OUT_SIGNED_APK);
  }
  
  // Also clean up idsig file if it exists
  const idsigFile = OUT_SIGNED_APK + '.idsig';
  if (fs.existsSync(idsigFile)) {
    fs.unlinkSync(idsigFile);
  }

  run(
    JAVA_EXE,
    [
      '-Xmx1024M',
      '-Xss1m',
      '-jar',
      APKSIGNER_JAR,
      'sign',
      '--ks',
      KEYSTORE_PATH,
      '--ks-key-alias',
      ALIAS,
      '--ks-pass',
      `pass:${KEYSTORE_PASSWORD}`,
      '--key-pass',
      `pass:${KEYSTORE_PASSWORD}`,
      '--out',
      OUT_SIGNED_APK,
      TEMP_ALIGNED_APK
    ],
    'Signing APK with apksigner'
  );

  // 3. Process and Sign App Bundle (AAB)
  if (!fs.existsSync(SRC_AAB)) {
    console.error(`❌  Source AAB not found at: ${SRC_AAB}`);
    process.exit(1);
  }

  // Copy unsigned AAB to destination path first, then sign it in-place (standard jarsigner behavior)
  if (fs.existsSync(OUT_SIGNED_AAB)) {
    fs.unlinkSync(OUT_SIGNED_AAB);
  }
  fs.copyFileSync(SRC_AAB, OUT_SIGNED_AAB);

  run(
    JARSIGNER_EXE,
    [
      '-keystore',
      KEYSTORE_PATH,
      '-storepass',
      KEYSTORE_PASSWORD,
      '-keypass',
      KEYSTORE_PASSWORD,
      OUT_SIGNED_AAB,
      ALIAS
    ],
    'Signing AAB with jarsigner'
  );

  // 4. Copy APK to D:\incoming
  const INCOMING_DIR = 'D:\\incoming';
  const INCOMING_APK = path.join(INCOMING_DIR, 'TodoTxt-Android-Release.apk');
  
  try {
    if (!fs.existsSync(INCOMING_DIR)) {
      fs.mkdirSync(INCOMING_DIR, { recursive: true });
    }
    fs.copyFileSync(OUT_SIGNED_APK, INCOMING_APK);
    console.log(`🚀  Copied signed APK to: ${INCOMING_APK}`);
  } catch (err) {
    console.warn(`⚠️  Failed to copy APK to D:\\incoming: ${err.message}`);
  }

  console.log('\n🎉✨  Android APK and App Bundle (AAB) successfully generated and signed!  ✨🎉\n');
  console.log(`📦  APK (ready for installation/testing): ${OUT_SIGNED_APK}`);
  console.log(`📦  AAB (ready for Google Play Store upload): ${OUT_SIGNED_AAB}\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
