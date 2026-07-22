const API_BASE_URL: string =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

type ApiSuccessEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach access token when present
  try {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("access_token")
        : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore storage errors
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let json: ApiSuccessEnvelope<T> | undefined;
  try {
    json = (await response.json()) as ApiSuccessEnvelope<T>;
  } catch {
    // ignore JSON parse errors; will throw below
  }

  if (!response.ok || !json) {
    const message =
      (json as ApiSuccessEnvelope<unknown> | undefined)?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json.data;
}

export const APIService = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};

