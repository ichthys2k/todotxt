import type { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';
dotenv.config();

const config: CapacitorConfig = {
  appId: 'de.lipponer.www.twa',
  appName: 'Todo.txt',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
