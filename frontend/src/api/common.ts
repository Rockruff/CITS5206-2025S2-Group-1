import useSWR, { SWRConfiguration, SWRResponse, mutate } from "swr";

export type APIError = { error: string; data?: any };

// --------------------
// Auth helpers
// --------------------

export function login(access: string, refresh: string) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  try {
    document.cookie = `logged_in=1; Path=/; Max-Age=${7 * 24 * 60 * 60}`; // 7 days
  } catch {}

  let next = sessionStorage.getItem("next") || "/dashboard";
  if (next === "/") next = "/dashboard";
  sessionStorage.removeItem("next");
  location.assign(next);
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  try {
    document.cookie = "logged_in=; Path=/; Max-Age=0";
  } catch {}

  const next = location.pathname;
  sessionStorage.setItem("next", next);
  location.assign("/login");
}

async function refresh() {
  const refresh = localStorage.getItem("refresh");
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  }).catch(() => ({ ok: false }) as const);

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const { access } = await response.json();
  localStorage.setItem("access", access);
}

// --------------------
// Helpers
// --------------------

async function handleError(response: Response): Promise<APIError> {
  let data: any;

  try {
    data = await response.json();
    if (typeof data !== "object" || data === null) {
      throw new Error("Response is not a JSON object");
    }
    if (typeof data.error === "string") {
      return { error: data.error };
    }
    return {
      error: `HTTP ${response.status}: ${response.statusText}`,
      data,
    };
  } catch {
    return {
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  }
}

async function request<T>(
  method: string,
  path: string,
  params: Record<string, any> | FormData = {},
  handled401: boolean = false,
): Promise<T> {
  const url = new URL(path, location.origin);

  const headers: Record<string, string> = {};
  const access = localStorage.getItem("access");
  if (access) headers["Authorization"] = `Bearer ${access}`;

  const config: RequestInit = { method, headers };

  if (method === "GET") {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  } else if (params instanceof FormData) {
    // For file uploads: do not set Content-Type, browser handles it
    config.body = params;
  } else {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(params);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    throw { error: String(err) } satisfies APIError;
  }

  if (response.status === 401) {
    try {
      if (handled401) throw undefined;
      await refresh();
    } catch {
      throw { error: "Your session expired, please log in again" } satisfies APIError;
    }
    return request(method, path, params, true);
  }

  if (!response.ok) {
    throw await handleError(response);
  }

  try {
    const json = await response.json();
    return json;
  } catch {
    return undefined as T;
  }
}

// --------------------
// Convenience methods
// --------------------

export function get<T>(path: string, params: Record<string, any> = {}) {
  return request<T>("GET", path, params);
}
export function post<T>(path: string, params: Record<string, any> = {}) {
  return request<T>("POST", path, params);
}
export function put<T>(path: string, params: Record<string, any> = {}) {
  return request<T>("PUT", path, params);
}
export function patch<T>(path: string, params: Record<string, any> = {}) {
  return request<T>("PATCH", path, params);
}
export function del<T>(path: string, params: Record<string, any> = {}) {
  return request<T>("DELETE", path, params);
}

// --------------------
// SWR helpers
// --------------------

export function swr<T>(
  path: string | null,
  params: Record<string, any> = {},
  config?: SWRConfiguration<T, APIError>,
): SWRResponse<T, APIError> {
  // Only build the SWR key if path exists
  const key: [string, Record<string, any>] | null = path ? [path, params] : null;
  return useSWR<T, APIError, [string, Record<string, any>] | null>(
    key,
    key ? ([url, query]) => get<T>(url, query) : null,
    config,
  );
}

export function revalidatePath(path: string) {
  return mutate((key) => Array.isArray(key) && typeof key[0] === "string" && key[0] === path, undefined, {
    revalidate: true,
  });
}
