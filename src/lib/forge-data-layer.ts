// forge-data-layer.ts — Phase 5: typed data layer generator.
// Produces a shared, production-grade data layer for generated React projects:
//   - Typed HTTP client (ApiClient) with interceptors, timeout, retry
//   - Shared API types (ApiResponse, PaginatedResponse, ApiError, QueryKey)
//   - Generic TanStack Query v5 hooks (useQuery / useMutation / useInfiniteQuery / usePaginatedQuery)
//   - MSW mock server setup with helpers
//   - Configured QueryClient factory
//   - Utility helpers (cn, formatters, debounce, groupBy, unique, ...)
//   - Zod validation schemas + helpers
//   - App constants (env-driven API URL, storage keys, routes, defaults)
//
// The generated layer is framework-agnostic at the repository level: features
// inject repository functions as `fetcher`s into the hooks, keeping the UI
// decoupled from the transport (real fetch or MSW).

import type { GeneratedFile } from "./forge-config";

// ============================================================================
// 1. src/shared/api/types.ts
// ============================================================================

const typesFile = `/**
 * Shared API types for the data layer.
 * Re-exported from \`src/shared/api/index.ts\`.
 */
import type { QueryKey as TanStackQueryKey } from "@tanstack/react-query";

/**
 * Standard API envelope returned by every successful/failed endpoint.
 * The ApiClient automatically unwraps \`data\` for consumers.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/** Paginated list response. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * Typed query key alias for TanStack Query.
 * Always use this instead of bare arrays to keep key construction consistent.
 */
export type QueryKey = TanStackQueryKey;

/** Options passed by hooks to fetchers (repository methods). */
export interface FetcherOptions {
  /** Abort signal wired up by TanStack Query for cancellation. */
  signal?: AbortSignal;
}

/**
 * Typed error thrown by the ApiClient and surfaced to TanStack Query.
 * Status codes follow HTTP semantics:
 *   - 0   : network/transport failure
 *   - 408 : request timeout
 *   - 401 : unauthorized (auto-redirect to login)
 *   - 4xx : client error
 *   - 5xx : server error
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    // Restore prototype chain (required when extending built-ins under ES5 targets).
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True for 4xx client errors. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** True for 5xx server errors. */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** True for transport-level failures (status 0) or timeouts (408). */
  get isNetworkError(): boolean {
    return this.status === 0 || this.status === 408;
  }

  /** Convenience factory for unauthorized errors. */
  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  /** Convenience factory for not-found errors. */
  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, message);
  }

  /** Serialize to a plain object for logging / telemetry. */
  toJSON(): { name: string; status: number; message: string; details?: unknown } {
    return { name: this.name, status: this.status, message: this.message, details: this.details };
  }
}
`;

// ============================================================================
// 2. src/shared/lib/constants.ts
// ============================================================================

const constantsFile = `/// <reference types="vite/client" />
/**
 * Application constants. Import from \`@/shared/lib\` (or the api barrel).
 *
 * Values are env-driven where it makes sense (Vite exposes them via
 * \`import.meta.env\`); the rest are compile-time literals used for
 * consistency across the app.
 */

/** API base URL. Empty string means "same-origin" (works with MSW). */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

/** Application identity. */
export const APP_NAME = "React Forge App";
export const APP_VERSION = "0.1.0";

/** Namespaced localStorage keys to avoid collisions with other apps. */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "rf:auth-token",
  USER_PREFS: "rf:user-prefs",
  THEME: "rf:theme",
  REDIRECT_AFTER_LOGIN: "rf:redirect-after-login",
} as const;

/** Route paths used across the app. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",
  DASHBOARD: "/dashboard",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  NOT_FOUND: "/404",
} as const;

/** Alias used by the HTTP client for the 401 redirect. */
export const LOGIN_ROUTE = ROUTES.LOGIN;

/** Default page size for paginated queries. */
export const DEFAULT_PAGE_SIZE = 20;

/** API request timeout (30s). */
export const API_TIMEOUT_MS = 30_000;

/** UI debounce delays (ms). */
export const DEBOUNCE = {
  SEARCH: 300,
  AUTOSAVE: 800,
  INPUT: 150,
  RESIZE: 200,
} as const;

/** QueryClient defaults. */
export const QUERY_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

/** Union of all storage keys (useful for typed getters/setters). */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Union of all route paths (useful for typed navigation). */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
`;

// ============================================================================
// 3. src/shared/api/client.ts
// ============================================================================

const clientFile = `/**
 * Typed HTTP client built on the native \`fetch\` API.
 *
 * Features:
 *   - Base URL from \`VITE_API_URL\` (defaults to same-origin so MSW just works)
 *   - Default headers (Content-Type, Accept)
 *   - Request interceptor: injects the Bearer token from localStorage
 *   - Response interceptor: unwraps the ApiResponse envelope, surfaces ApiError
 *   - 30s default timeout (overridable per request)
 *   - Single retry on network error (not on abort/timeout/4xx)
 *   - 401 → clears token + redirects to /login
 *
 * The client is transport-agnostic: in development the same calls are
 * intercepted by MSW (Mock Service Worker) without any code change.
 */
import { ApiError, type ApiResponse } from "./types";
import { API_URL, API_TIMEOUT_MS, STORAGE_KEYS, LOGIN_ROUTE } from "../lib/constants";

/** Per-request options accepted by every ApiClient method. */
export interface RequestOptions {
  /** Optional abort signal from the caller (composed with the timeout signal). */
  signal?: AbortSignal;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** Per-request timeout in ms. Defaults to API_TIMEOUT_MS (30s). */
  timeoutMs?: number;
  /** When true, skip the Authorization header even if a token exists. */
  skipAuth?: boolean;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl.replace(/\\/+$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /** Read the auth token from localStorage (defensive against private mode / SSR). */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  /** Merge default headers with per-request overrides and inject the auth token. */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };
    if (!options.skipAuth) {
      const token = this.getAuthToken();
      if (token) headers.Authorization = \`Bearer \${token}\`;
    }
    return headers;
  }

  /** Combine baseUrl with a path, preserving absolute URLs and query strings. */
  private buildUrl(path: string): string {
    if (/^https?:\\/\\//i.test(path)) return path;
    const slash = path.startsWith("/") ? path : \`/\${path}\`;
    return \`\${this.baseUrl}\${slash}\`;
  }

  /** Triggered on 401 — clears the session and redirects to the login route. */
  private handleUnauthorized(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_PREFS);
    } catch {
      /* ignore storage errors */
    }
    if (typeof window !== "undefined") {
      const current = window.location.pathname;
      if (!current.startsWith(LOGIN_ROUTE)) {
        const from = encodeURIComponent(current + window.location.search);
        window.location.assign(\`\${LOGIN_ROUTE}?from=\${from}\`);
      }
    }
  }

  /** Extract a human-readable error message from the raw JSON body, if any. */
  private extractErrorMessage(raw: unknown): string | undefined {
    if (
      raw &&
      typeof raw === "object" &&
      "error" in raw &&
      typeof (raw as { error?: unknown }).error === "string"
    ) {
      return (raw as { error: string }).error;
    }
    return undefined;
  }

  /** Parse the response body and surface a typed ApiError on failure. */
  private async parseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("Content-Type") ?? "";
    const isJson = contentType.includes("application/json");
    const raw: unknown = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const message =
        this.extractErrorMessage(raw) ||
        response.statusText ||
        \`HTTP \${response.status}\`;
      throw new ApiError(response.status, message, isJson ? raw : undefined);
    }

    // Unwrap the ApiResponse envelope if present.
    if (
      isJson &&
      raw &&
      typeof raw === "object" &&
      "success" in raw
    ) {
      const envelope = raw as ApiResponse<T>;
      if (envelope.success === false) {
        throw new ApiError(response.status, envelope.error ?? "Request failed", envelope);
      }
      return envelope.data;
    }

    // Fallback: return the raw payload (or undefined for empty bodies).
    return (raw ?? undefined) as T;
  }

  /** Single fetch attempt with abort-based timeout. */
  private async doFetch(
    method: HttpMethod,
    url: string,
    headers: Record<string, string>,
    body: unknown,
    options: RequestOptions
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? API_TIMEOUT_MS
    );
    // Compose the caller's signal with our internal timeout signal.
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const init: RequestInit = { method, headers, signal: controller.signal };
    if (payload !== undefined) init.body = payload;
    try {
      return await fetch(url, init);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Core request method — timeout, retry-on-network-error, interceptors. */
  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(options);

    let response: Response;
    try {
      response = await this.doFetch(method, url, headers, body, options);
    } catch (err) {
      // Abort/timeout: do not retry.
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiError(408, "Request timed out", { cause: String(err) });
      }
      // Network error: single retry.
      try {
        response = await this.doFetch(method, url, headers, body, options);
      } catch (retryErr) {
        throw new ApiError(0, "Network error: unable to reach the server", {
          cause: retryErr instanceof Error ? retryErr.message : String(retryErr),
        });
      }
    }

    if (response.status === 401) {
      this.handleUnauthorized();
    }
    return this.parseBody<T>(response);
  }

  /** GET request. */
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  /** POST request with a JSON body. */
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  /** PUT request with a full-resource body. */
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  /** PATCH request with a partial body. */
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PATCH", path, body, options);
  }

  /** DELETE request. */
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

/** Shared singleton used by repositories and hooks. */
export const apiClient = new ApiClient();
`;

// ============================================================================
// 4. src/shared/api/query-client.ts
// ============================================================================

const queryClientFile = `/**
 * QueryClient factory with sensible defaults.
 * Import \`createQueryClient\` once in your app entry (main.tsx) and pass the
 * result to <QueryClientProvider>.
 */
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./types";
import { QUERY_DEFAULTS } from "../lib/constants";

/**
 * Create a configured QueryClient.
 *
 * Defaults:
 *   - staleTime: 60s (avoid refetch storms)
 *   - gcTime:    5min (keep unused data in cache briefly)
 *   - retry:     1 attempt, but never on 4xx (except 408/429)
 *   - refetchOnWindowFocus: false (no surprise refetches)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULTS.staleTime,
        gcTime: QUERY_DEFAULTS.gcTime,
        retry: (failureCount, error) => {
          // Never retry client errors (except timeout / rate-limit).
          if (
            error instanceof ApiError &&
            error.isClientError &&
            !error.isNetworkError &&
            error.status !== 429
          ) {
            return false;
          }
          return failureCount < QUERY_DEFAULTS.retry;
        },
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
      },
      mutations: {
        // Mutations should not auto-retry; surface errors to the UI.
        retry: false,
      },
    },
  });
}
`;

// ============================================================================
// 5. src/shared/api/hooks.ts
// ============================================================================

const hooksFile = `/**
 * Generic TanStack Query v5 hooks.
 *
 * Design: hooks accept a \`fetcher\` function (typically a repository method).
 * The repository layer owns the transport (it calls ApiClient), keeping the
 * UI completely decoupled from HTTP details. Cancellation is wired through
 * the AbortSignal provided by TanStack Query.
 */
import {
  useQuery as useReactQuery,
  useMutation as useReactMutation,
  useInfiniteQuery as useReactInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { ApiError, type FetcherOptions, type PaginatedResponse, type QueryKey } from "./types";

/**
 * Typed wrapper around useQuery with ApiError as the error channel.
 *
 * @example
 * const { data, isLoading } = useQuery(["tasks"], ({ signal }) =>
 *   taskRepository.list({ signal })
 * );
 */
export function useQuery<T>(
  key: QueryKey,
  fetcher: (opts: FetcherOptions) => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError, T, QueryKey>, "queryKey" | "queryFn">
) {
  return useReactQuery<T, ApiError, T, QueryKey>({
    queryKey: key,
    queryFn: ({ signal }) => fetcher({ signal }),
    ...options,
  });
}

/**
 * Typed wrapper around useMutation.
 * Supports optimistic updates via onMutate / onError / onSettled in options.
 *
 * @example
 * const { mutateAsync } = useMutation(
 *   (input: CreateTaskInput) => taskRepository.create(input),
 *   {
 *     onMutate: async (input) => {
 *       await queryClient.cancelQueries({ queryKey: ["tasks"] });
 *       const prev = queryClient.getQueryData<Task[]>(["tasks"]);
 *       queryClient.setQueryData<Task[]>(["tasks"], (old) => [...(old ?? []), { ...input, id: "tmp" }]);
 *       return { prev };
 *     },
 *     onError: (_err, _input, ctx) => {
 *       if (ctx?.prev) queryClient.setQueryData(["tasks"], ctx.prev);
 *     },
 *     onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
 *   }
 * );
 */
export function useMutation<TData = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables, TContext>, "mutationFn">
) {
  return useReactMutation<TData, ApiError, TVariables, TContext>({
    mutationFn,
    ...options,
  });
}

/**
 * Typed wrapper around useInfiniteQuery for cursor/offset pagination.
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
 *   ["tasks", "infinite"],
 *   ({ pageParam, signal }) => taskRepository.list({ page: pageParam, signal }),
 *   { initialPageParam: 1, getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined }
 * );
 */
export function useInfiniteQuery<T>(
  key: QueryKey,
  fetcher: (opts: FetcherOptions & { pageParam: number }) => Promise<T>,
  options: {
    /** First page parameter (defaults to 1). */
    initialPageParam?: number;
    /** Required — determines when there is no next page. */
    getNextPageParam: (
      lastPage: T,
      allPages: T[],
      lastPageParam: number,
      allPageParams: number[]
    ) => number | undefined;
    getPreviousPageParam?: (
      firstPage: T,
      allPages: T[],
      firstPageParam: number,
      allPageParams: number[]
    ) => number | undefined;
  } & Omit<
      UseInfiniteQueryOptions<T, ApiError, T, QueryKey, number>,
      | "queryKey"
      | "queryFn"
      | "initialPageParam"
      | "getNextPageParam"
      | "getPreviousPageParam"
    >
) {
  const { initialPageParam, ...rest } = options;
  return useReactInfiniteQuery<T, ApiError, T, QueryKey, number>({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => fetcher({ pageParam, signal }),
    initialPageParam: initialPageParam ?? 1,
    ...rest,
  });
}

/**
 * Convenience hook for endpoints that return PaginatedResponse<T>.
 * Keeps the previous page visible while fetching the next one (placeholderData).
 *
 * @example
 * const { data, isLoading } = usePaginatedQuery(
 *   ["tasks"],
 *   (page, { signal }) => taskRepository.list({ page, signal }),
 *   page
 * );
 */
export function usePaginatedQuery<T>(
  key: QueryKey,
  fetcher: (page: number, opts: FetcherOptions) => Promise<PaginatedResponse<T>>,
  page: number,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<T>, ApiError, PaginatedResponse<T>, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return useReactQuery<PaginatedResponse<T>, ApiError, PaginatedResponse<T>, QueryKey>({
    queryKey: [...key, { page }],
    queryFn: ({ signal }) => fetcher(page, { signal }),
    placeholderData: (prev) => prev,
    ...options,
  });
}
`;

// ============================================================================
// 6. src/shared/api/mock-server.ts
// ============================================================================

const mockServerFile = `/**
 * MSW (Mock Service Worker) setup for development and tests.
 *
 * In development, the same ApiClient calls are transparently intercepted by
 * MSW — no feature code needs to change between mock and real backend.
 *
 * Usage in main.tsx:
 *   if (import.meta.env.DEV) {
 *     const { setupMockServer } = await import("@/shared/api/mock-server");
 *     await setupMockServer(handlers);
 *   }
 */
import { setupWorker } from "msw/browser";
import {
  http,
  HttpResponse,
  type HttpHandler,
  type HttpResponseResolver,
  type PathParams,
  type DefaultBodyType,
} from "msw";
import { DEFAULT_PAGE_SIZE } from "../lib/constants";

/** Add a realistic delay to a mock response (default 300ms). */
export async function mockDelay(ms = 300): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type MockMethod = "get" | "post" | "put" | "patch" | "delete";

const methodFactories: Record<MockMethod, typeof http.get> = {
  get: http.get,
  post: http.post,
  put: http.put,
  patch: http.patch,
  delete: http.delete,
};

/**
 * Build a single MSW handler bound to a method, path and resolver.
 *
 * @example
 * const handler = createMockHandler("get", "/api/tasks", async () => {
 *   await mockDelay();
 *   return okResponse([{ id: 1, title: "Demo" }]);
 * });
 */
export function createMockHandler(
  method: MockMethod,
  path: string,
  resolver: HttpResponseResolver<PathParams, DefaultBodyType>
): HttpHandler {
  const factory = methodFactories[method];
  return factory(path, resolver);
}

/** Wrap a value into a standard success ApiResponse envelope. */
export function okResponse<T>(data: T, init?: ResponseInit): Response {
  return HttpResponse.json({ success: true, data, error: undefined }, init);
}

/** Wrap an error message into a failed ApiResponse envelope. */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): Response {
  return HttpResponse.json(
    { success: false, data: null, error: message, details },
    { status }
  );
}

/** Build a paginated mock response. */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  total: number
): Response {
  return okResponse({
    items,
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    hasNext: page * DEFAULT_PAGE_SIZE < total,
  });
}

/** The MSW worker type (kept abstract so callers don't depend on internal types). */
export type MockWorker = ReturnType<typeof setupWorker>;

let workerPromise: Promise<MockWorker> | null = null;

/**
 * Start the MSW worker with the given handlers (idempotent).
 * Unhandled requests fall through to the network (real backend).
 */
export async function setupMockServer(
  handlers: HttpHandler[]
): Promise<MockWorker> {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const worker = setupWorker(...handlers);
    const base = (import.meta.env.BASE_URL as string | undefined) ?? "/";
    await worker.start({
      onUnhandledRequest: "bypass",
      quiet: false,
      serviceWorker: { url: \`\${base}mockServiceWorker.js\` },
    });
    return worker;
  })();
  return workerPromise;
}
`;

// ============================================================================
// 7. src/shared/api/index.ts
// ============================================================================

const apiIndexFile = `/**
 * Barrel export for the data layer's API surface.
 *
 * Import hooks and the client from here:
 *   import { useQuery, apiClient, ApiError } from "@/shared/api";
 */
export { ApiClient, apiClient, type RequestOptions } from "./client";
export {
  ApiError,
  type ApiResponse,
  type PaginatedResponse,
  type QueryKey,
  type FetcherOptions,
} from "./types";
export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  usePaginatedQuery,
} from "./hooks";
export { createQueryClient } from "./query-client";
export {
  setupMockServer,
  createMockHandler,
  mockDelay,
  okResponse,
  errorResponse,
  paginatedResponse,
} from "./mock-server";
`;

// ============================================================================
// 8. src/shared/lib/utils.ts
// ============================================================================

const utilsFile = `/**
 * General-purpose utility functions.
 * Pure, side-effect-free, fully typed, tree-shakeable.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a numeric amount as a localized currency string. */
export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

/** Format a date as a localized short date (e.g. "Jan 5, 2025"). */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Format a date/time as a localized short date + time. */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Format a date as a relative time string (e.g. "il y a 2 min", "in 3 days"). */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const units: ReadonlyArray<{ unit: Intl.RelativeTimeFormatUnit; sec: number }> = [
    { unit: "year", sec: 31_536_000 },
    { unit: "month", sec: 2_592_000 },
    { unit: "day", sec: 86_400 },
    { unit: "hour", sec: 3_600 },
    { unit: "minute", sec: 60 },
    { unit: "second", sec: 1 },
  ];
  for (const { unit, sec } of units) {
    if (absSec >= sec || unit === "second") {
      return rtf.format(Math.round(diffSec / sec), unit);
    }
  }
  return rtf.format(0, "second");
}

/** Format a number with localized thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/** Convert a string to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/[\\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Debounce a function (trailing edge). Returns a cancelable wrapper. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  return debounced;
}

/** Promise-based delay. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True for null, undefined, "", [], {}, false (other primitives are non-empty). */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" || Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
}

/** Group items into a Map keyed by a derived value. */
export function groupBy<T, K extends string | number | symbol>(
  items: readonly T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

/** Deduplicate an array of primitives, or by a key function for objects. */
export function unique<T>(items: readonly T[]): T[];
export function unique<T, K>(items: readonly T[], keyFn: (item: T) => K): T[];
export function unique<T, K>(items: readonly T[], keyFn?: (item: T) => K): T[] {
  if (!keyFn) return Array.from(new Set(items));
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of items) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/** Truncate a string to maxLen chars, appending an ellipsis if cut. */
export function truncate(input: string, maxLen: number): string {
  if (input.length <= maxLen) return input;
  return input.slice(0, Math.max(0, maxLen - 1)).trimEnd() + "…";
}

/** Safe JSON parse that returns a fallback on error. */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
`;

// ============================================================================
// 9. src/shared/lib/validation.ts
// ============================================================================

const validationFile = `/**
 * Runtime validation helpers built on Zod.
 *
 * Use these schemas to validate user input, API payloads, localStorage blobs,
 * URL params, etc. Combine schemas with \`.extend\` / \`.merge\` for feature
 * forms.
 */
import { z, type ZodSchema } from "zod";

/** Simplified RFC-5322 email. */
export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Min 8 chars, at least 1 uppercase letter and 1 digit. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/** UUID v4. */
export const uuidSchema = z.string().uuid();

/** HTTP(S) URL. */
export const urlSchema = z.string().url();

/** International phone number (digits, +, spaces, dashes, parens). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\\+?[\\d\\s()-]{6,20}$/)
  .refine((v) => v.replace(/\\D/g, "").length >= 7, "Phone number is too short");

/** ISO date string (YYYY-MM-DD). */
export const dateSchema = z
  .string()
  .regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

/** Non-empty trimmed string. */
export const nonEmptyStringSchema = z.string().trim().min(1);

/** Positive integer (>= 1). */
export const positiveIntSchema = z.number().int().positive();

/** Non-negative integer (>= 0). */
export const nonNegativeIntSchema = z.number().int().nonnegative();

export type ValidationResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: z.ZodError };

/**
 * Validate data against a Zod schema without throwing.
 * Returns a discriminated union the caller can narrow on.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, error: null };
  }
  return { success: false, data: null, error: result.error };
}

/** Parse data or throw the underlying ZodError. */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/** Convert a ZodError into a flat { field: message } record (first error per field). */
export function zodErrorToRecord(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
`;

// ============================================================================
// 10. src/shared/lib/index.ts
// ============================================================================

const libIndexFile = `/**
 * Barrel export for shared library code.
 *
 * Import utilities, validation schemas and constants from here:
 *   import { cn, emailSchema, API_URL } from "@/shared/lib";
 */
export * from "./utils";
export * from "./validation";
export * from "./constants";
`;

// ============================================================================
// Generator entry point
// ============================================================================

/**
 * Build the shared data layer as a list of GeneratedFile entries.
 *
 * The returned files form a self-contained \`src/shared\` package that any
 * feature in a generated project can import via the \`@/shared/api\` and
 * \`@/shared/lib\` aliases (configured in tsconfig + vite by Phase 1).
 *
 * Files produced (10):
 *   - src/shared/api/types.ts          — ApiResponse, PaginatedResponse, ApiError, QueryKey
 *   - src/shared/api/client.ts         — ApiClient (fetch + interceptors + timeout + retry)
 *   - src/shared/api/query-client.ts   — createQueryClient() factory
 *   - src/shared/api/hooks.ts          — useQuery / useMutation / useInfiniteQuery / usePaginatedQuery
 *   - src/shared/api/mock-server.ts    — MSW setup + helpers
 *   - src/shared/api/index.ts          — API barrel
 *   - src/shared/lib/utils.ts          — cn, formatters, debounce, groupBy, unique, ...
 *   - src/shared/lib/validation.ts     — Zod schemas + validate / parseOrThrow
 *   - src/shared/lib/constants.ts      — API_URL, STORAGE_KEYS, ROUTES, defaults
 *   - src/shared/lib/index.ts          — lib barrel
 *
 * @returns the 10 GeneratedFile entries, ready to be merged into a project.
 */
export function buildDataLayer(): GeneratedFile[] {
  return [
    { path: "src/shared/api/types.ts", language: "typescript", content: typesFile },
    { path: "src/shared/lib/constants.ts", language: "typescript", content: constantsFile },
    { path: "src/shared/api/client.ts", language: "typescript", content: clientFile },
    { path: "src/shared/api/query-client.ts", language: "typescript", content: queryClientFile },
    { path: "src/shared/api/hooks.ts", language: "typescript", content: hooksFile },
    { path: "src/shared/api/mock-server.ts", language: "typescript", content: mockServerFile },
    { path: "src/shared/api/index.ts", language: "typescript", content: apiIndexFile },
    { path: "src/shared/lib/utils.ts", language: "typescript", content: utilsFile },
    { path: "src/shared/lib/validation.ts", language: "typescript", content: validationFile },
    { path: "src/shared/lib/index.ts", language: "typescript", content: libIndexFile },
  ];
}
