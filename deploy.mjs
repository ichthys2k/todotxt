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
    
    console.log(`Lade Dateien aus ${localDir} direkt in das Stammverzeichnis (/) hoch...`);
    await sftp.uploadDir(localDir, remoteDir);
    console.log('Upload erfolgreich beendet!');
  } catch (err) {
    console.error('Fehler beim Deployment:', err);
  } finally {
    sftp.end();
  }
}

deploy();
