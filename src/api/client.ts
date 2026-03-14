import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";
import { ApiError, ApiErrorPayload, HttpMethod } from "./types";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipContractCheck?: boolean;
  parse?: (input: unknown) => unknown;
};

const API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() || "8000";
const APP_VERSION = Constants.expoConfig?.version ?? "dev";
const API_CONTRACT_ID =
  process.env.EXPO_PUBLIC_API_CONTRACT_ID?.trim() ?? "whoisnot-public-admin-api";
const API_CONTRACT_VERSION =
  process.env.EXPO_PUBLIC_API_CONTRACT_VERSION?.trim() ?? "v1";

let accessTokenGetter: (() => string | null | undefined) | null = null;

export function setApiAccessTokenGetter(
  getter: (() => string | null | undefined) | null
) {
  accessTokenGetter = getter;
}

function extractHost(raw?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const noScheme = trimmed.replace(/^[a-z]+:\/\//i, "");
  const host = noScheme.split("/")[0]?.split(":")[0];
  return host || null;
}

function getExpoDebugHost() {
  const c = Constants as any;
  const candidates: Array<string | undefined> = [
    c?.expoConfig?.hostUri,
    c?.manifest2?.extra?.expoGo?.debuggerHost,
    c?.manifest?.debuggerHost,
  ];
  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) return host;
  }
  return null;
}

function getBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (__DEV__) {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    const scriptHost = extractHost(scriptURL);
    const expoHost = getExpoDebugHost();
    const host = scriptHost || expoHost;
    if (host) {
      // Android emulator cannot reach host machine via localhost.
      if (Platform.OS === "android" && host === "localhost") {
        return `http://10.0.2.2:${API_PORT}`;
      }
      return `http://${host}:${API_PORT}`;
    }

    if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
    return `http://localhost:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

const API_BASE_URL = getBaseUrl();

/** Base URL for API. Use when resolving relative media URLs (e.g. /storage/...) */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function makeTraceId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeApiError(
  status: number | null,
  payload: unknown,
  fallbackMessage: string,
  path: string
) {
  const body =
    payload && typeof payload === "object" ? (payload as ApiErrorPayload) : {};

  return new ApiError({
    message: body.message || fallbackMessage,
    status,
    code: body.code || "UNKNOWN_ERROR",
    traceId: body.traceId ?? null,
    details: body.details,
    path: body.path ?? path,
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const traceId = makeTraceId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const token = options.skipAuth ? null : accessTokenGetter?.() ?? null;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": traceId,
        "x-client-platform": Platform.OS,
        "x-client-app-version": APP_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const responseContractId = res.headers.get("x-api-contract-id");
    const responseContractVersion = res.headers.get("x-api-contract-version");
    if (!options.skipContractCheck) {
      if (
        (responseContractId && responseContractId !== API_CONTRACT_ID) ||
        (responseContractVersion && responseContractVersion !== API_CONTRACT_VERSION)
      ) {
        throw new ApiError({
          status: res.status,
          code: "CONTRACT_MISMATCH",
          message:
            "Client and server API contract do not match. Please update the app/backend.",
          traceId: res.headers.get("x-trace-id") ?? traceId,
          details: {
            expected: {
              id: API_CONTRACT_ID,
              version: API_CONTRACT_VERSION,
            },
            received: {
              id: responseContractId,
              version: responseContractVersion,
            },
          },
          path,
        });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      const parsed = text ? parseJsonSafe(text) : null;
      throw normalizeApiError(
        res.status,
        parsed,
        `API ${res.status}: ${text || "Request failed"}`,
        path
      );
    }

    if (res.status === 204) return undefined as T;
    const raw = (await res.json()) as unknown;
    const parsed = options.parse ? options.parse(raw) : raw;
    return parsed as T;
  } catch (e: unknown) {
    if (e instanceof ApiError) throw e;

    if (
      typeof e === "object" &&
      e !== null &&
      "name" in e &&
      (e as { name?: string }).name === "AbortError"
    ) {
      throw new ApiError({
        status: null,
        code: "TIMEOUT",
        message: "Request timeout",
        traceId,
        path,
      });
    }

    if (e instanceof Error) {
      throw new ApiError({
        status: null,
        code: "NETWORK_ERROR",
        message: e.message || "Network request failed",
        traceId,
        path,
      });
    }

    throw new ApiError({
      status: null,
      code: "UNKNOWN_ERROR",
      message: "Unknown API error",
      traceId,
      path,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(
  path: string,
  options: Omit<RequestOptions, "method" | "body"> = {}
) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
) {
  return apiRequest<T>(path, { ...options, method: "POST", body });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
) {
  return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

export async function apiDelete<T>(
  path: string,
  options: Omit<RequestOptions, "method" | "body"> = {}
) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

export function getApiContractConfig() {
  return {
    id: API_CONTRACT_ID,
    version: API_CONTRACT_VERSION,
  };
}
