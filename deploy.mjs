import Client from 'ssh2-sftp-client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config();

const sftp = new Client();

const config = {
  host: process.env.SFTP_HOST,
  port: parseInt(process.env.SFTP_PORT || '22', 10),
  username: process.env.SFTP_USERNAME,
  password: process.env.SFTP_PASSWORD
};

async function deploy() {
  try {
    console.log('Verbinde mit dem SFTP Server...');
    await sftp.connect(config);
    console.log('Verbunden.');
    
    const remoteDir = '/';
    const localDir = path.join(__dirname, 'dist');
    
    console.log(`Lade Web-Dateien aus ${localDir} direkt in das Stammverzeichnis (/) hoch...`);
    await sftp.uploadDir(localDir, remoteDir);

    // Upload dist-desktop files
    const localDesktopDir = path.join(__dirname, 'dist-desktop');
    const remoteDesktopDir = '/dist-desktop';
    console.log(`Erstelle Verzeichnis ${remoteDesktopDir} falls nicht vorhanden...`);
    try {
      await sftp.mkdir(remoteDesktopDir, true);
    } catch (e) {
      // folder might already exist
    }

    const filesToUpload = [
      'TodoTxt-Windows-Setup.exe',
      'TodoTxt-Windows-Portable.exe',
      'TodoTxt-Windows-Portable.zip'
    ];

    for (const file of filesToUpload) {
      const src = path.join(localDesktopDir, file);
      const dst = remoteDesktopDir + '/' + file;
      console.log(`Lade ${file} hoch...`);
      await sftp.fastPut(src, dst);
    }

    // Upload Android APK
    const localApk = path.join(__dirname, 'TodoTxt-Android-Release.apk');
    const remoteApk = '/TodoTxt-Android-Release.apk';
    console.log(`Lade ${localApk} hoch zu ${remoteApk}...`);
    await sftp.fastPut(localApk, remoteApk);

    console.log('Upload aller Versionen erfolgreich beendet!');
  } catch (err) {
    console.error('Fehler beim Deployment:', err);
  } finally {
    sftp.end();
  }
}

deploy();
