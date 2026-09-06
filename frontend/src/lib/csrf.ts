import { useState, useEffect, useCallback } from "react";

interface CsrfToken {
  token: string;
  expiresAt: number;
}

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER = "X-CSRF-Token";
const CSRF_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Get or generate a fresh CSRF token
 */
export async function getCsrfToken(): Promise<string> {
  try {
    // Try to get token from cookie first
    const response = await fetch("/api/csrf", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }

  // Fallback: generate a token if server endpoint doesn't exist yet
  return generateToken();
}

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Set CSRF cookie for current origin
 */
export async function setCsrfCookie(token: string) {
  try {
    const response = await fetch("/api/csrf/set-cookie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER]: token,
      },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to set CSRF cookie:", error);
    return false;
  }
}

/**
 * Set CSRF token in cookie for use with fetch requests
 */
export function setCsrfCookieInBrowser(token: string) {
  try {
    const expires = new Date(Date.now() + CSRF_EXPIRY);
    document.cookie = `${CSRF_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=strict; Secure; HttpOnly`;
    return true;
  } catch (error) {
    console.error("Failed to set CSRF cookie:", error);
    return false;
  }
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === CSRF_COOKIE_NAME && value !== undefined) {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to parse CSRF cookie:", error);
    return null;
  }
}

/**
 * Attach CSRF token to fetch headers
 */
export function attachCsrfHeaders(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCsrfTokenFromCookie() || generateToken();

  const newHeaders = {
    ...headers,
    [CSRF_HEADER]: csrfToken,
  };

  // Also set cookie if missing
  if (!getCsrfTokenFromCookie()) {
    setCsrfCookieInBrowser(csrfToken);
  }

  return newHeaders;
}

/**
 * Custom hook to use CSRF protection
 */
export function useCsrf() {
  const [token, setToken] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const csrfToken = await getCsrfToken();
        setToken(csrfToken);
        setCsrfCookieInBrowser(csrfToken);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize CSRF token:", error);
      }
    };

    fetchToken();
  }, []);

  const attachHeaders = useCallback(
    (headers: HeadersInit = {}) => attachCsrfHeaders(headers),
    [token]
  );

  return { token, isReady, attachHeaders };
}

/**
 * Form data parser that includes CSRF token
 */
export function parseCsrfFormData(formData: FormData, csrfToken?: string) {
  const data = new FormData();
  formData.forEach((value, key) => data.append(key, value));
  if (csrfToken) {
    data.set("_csrf", csrfToken);
  }
  return data;
}

/**
 * Validate CSRF token from header
 */
export function validateCsrfHeader(request: Request): boolean {
  const requestHeaders = new Headers(request.headers);
  const csrfHeader = requestHeaders.get(CSRF_HEADER);
  const csrfCookie = getCsrfTokenFromCookie();

  return csrfHeader === csrfCookie;
}