import Client from 'ssh2-sftp-client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sftp = new Client();

const config = {
  host: '541931.ssh.w1.strato.hosting',
  port: 22,
  username: 'stu851261246',
  password: 'dfdfDFDF11!!332'
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
