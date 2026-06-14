import { msalInstance, graphScopes } from "../config/msal";
import type { AuthenticationResult } from "@azure/msal-browser";

export const loginWithMicrosoft = async () => {
  try {
    await msalInstance.loginRedirect(graphScopes);
    // Page will redirect, so no return needed
  } catch (error) {
    console.error('Fehler beim Microsoft MSAL Login:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (account) {
      await msalInstance.logoutRedirect({
        account: account
      });
    }
    console.log('Logout erfolgreich.');
  } catch (error) {
    console.error('Fehler beim Logout:', error);
    throw error;
  }
};

export const getGraphAccessToken = async (): Promise<string | null> => {
  try {
    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) {
      throw new Error("No active account! Verify a user has been signed in and setActiveAccount has been called.");
    }

    const response: AuthenticationResult = await msalInstance.acquireTokenSilent({
      ...graphScopes,
      account: account
    });
    
    return response.accessToken;
  } catch (error) {
    console.error("Fehler beim Token abrufen (Silent):", error);
    // Falls silent fehlschlägt (z.B. Session abgelaufen), Redirect erzwingen, da Popups blockiert werden
    try {
      await msalInstance.acquireTokenRedirect(graphScopes);
      return null;
    } catch (redirectError) {
      console.error("Fehler beim Token abrufen (Redirect):", redirectError);
      return null;
    }
  }
};

export const getUserProfilePhoto = async (): Promise<string | null> => {
  try {
    const token = await getGraphAccessToken();
    if (!token) return null;
    
    const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If the user has no photo set, it might return 404 or other errors.
      return null;
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Fehler beim Laden des Profilbilds:", error);
    return null;
  }
};

