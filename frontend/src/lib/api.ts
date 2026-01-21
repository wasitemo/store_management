const BASE_URL = "http://localhost:3000";

/**
 * Refresh access token using refresh token (cookie)
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/refresh-token`, {
      method: "POST",
      credentials: "include", // ⬅️ penting agar cookie terkirim
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newToken = data.access_token;

    if (newToken) {
      localStorage.setItem("access_token", newToken);
      return newToken;
    }

    return null;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
}

/**
 * Global API fetch with auto refresh token
 */export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem("access_token");

  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const finalUrl = url.startsWith("http")
    ? url
    : `${BASE_URL}${url}`;

  let response = await fetch(finalUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    headers.set("Authorization", `Bearer ${newToken}`);

    response = await fetch(finalUrl, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  return response;
}
