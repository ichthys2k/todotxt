import { PublicClientApplication } from "@azure/msal-browser";
import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    authority: "https://login.microsoftonline.com/common",
    // Redirect zu der aktuellen URL (sowohl lokal als auch auf Strato)
    redirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: "localStorage"
  }
};

// Instanziierung des MSAL Public Client
export const msalInstance = new PublicClientApplication(msalConfig);

// Berechtigungen, die wir anfordern
export const graphScopes = {
  scopes: ["User.Read", "Files.ReadWrite", "offline_access"]
};
