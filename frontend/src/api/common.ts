interface RequstPromise<T> extends Promise<T> {
  abort: () => void;
}

export class APIClient {
  async login(uwa_id: string) {
    const url = "/api/auth/login";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uwa_id: uwa_id }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const { access, refresh } = await response.json();
    localStorage.access = access;
    localStorage.refresh = refresh;
  }

  async refresh() {
    const url = "/api/auth/refresh";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: localStorage.refresh }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const { access } = await response.json();
    localStorage.access = access;
  }

  private request<T>(method: string, path: string, params: Record<string, any>): RequstPromise<T> {
    const url = new URL(path);
    const controller = new AbortController();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (localStorage.access) {
      headers["Authorization"] = `Bearer ${localStorage.access}`;
    }

    const config: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method === "GET") {
      for (const key in params) {
        url.searchParams.set(key, params[key]);
      }
    } else {
      config.body = JSON.stringify(params);
    }

    const promise: Promise<T> = (async () => {
      let response = await fetch(url, config);

      if (response.status === 401) {
        await this.refresh();
        headers["Authorization"] = `Bearer ${localStorage.access}`;
        response = await fetch(url, { ...config, headers });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    })();

    // extend the promise with an abort() method
    (promise as RequstPromise<T>).abort = () => controller.abort();
    return promise as RequstPromise<T>;
  }

  // Convenience methods
  get<T>(path: string, params: Record<string, any> = {}) {
    return this.request<T>("GET", path, params);
  }
  post<T>(path: string, params: Record<string, any> = {}) {
    return this.request<T>("POST", path, params);
  }
  put<T>(path: string, params: Record<string, any> = {}) {
    return this.request<T>("PUT", path, params);
  }
  patch<T>(path: string, params: Record<string, any> = {}) {
    return this.request<T>("PATCH", path, params);
  }
  delete<T>(path: string, params: Record<string, any> = {}) {
    return this.request<T>("DELETE", path, params);
  }
}

const api = new APIClient();
export default api;

// to be fixed later.
// We need to come up with a good way to define API helpers
export const fetcher = (...args) => fetch(...args).then((res) => res.json());
