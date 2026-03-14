import AsyncStorage from "@react-native-async-storage/async-storage";

const CRASH_REPORTS_KEY = "@whoisnot/crash_reports_v1";
const BREADCRUMBS_KEY = "@whoisnot/crash_breadcrumbs_v1";
const MAX_REPORTS = 20;
const MAX_BREADCRUMBS = 120;

type CrashKind =
  | "js_fatal"
  | "js_non_fatal"
  | "unhandled_promise_rejection"
  | "react_render_error";

type CrashBreadcrumb = {
  t: string;
  event: string;
  data?: Record<string, unknown>;
};

type CrashReport = {
  id: string;
  t: string;
  kind: CrashKind;
  message: string;
  stack?: string;
  isFatal?: boolean;
  extra?: Record<string, unknown>;
  breadcrumbs: CrashBreadcrumb[];
};

let initialized = false;
let previousGlobalHandler:
  | ((error: Error, isFatal?: boolean) => void)
  | undefined;
let originalConsoleError: typeof console.error | undefined;

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toError(input: unknown): Error {
  if (input instanceof Error) return input;
  return new Error(typeof input === "string" ? input : JSON.stringify(input));
}

async function readJsonArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(key: string, value: T[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No-op: storage failure should not crash the app.
  }
}

export async function addCrashBreadcrumb(
  event: string,
  data?: Record<string, unknown>,
) {
  const next: CrashBreadcrumb = {
    t: new Date().toISOString(),
    event,
    data,
  };
  const current = await readJsonArray<CrashBreadcrumb>(BREADCRUMBS_KEY);
  const merged = [...current, next].slice(-MAX_BREADCRUMBS);
  await writeJsonArray(BREADCRUMBS_KEY, merged);
}

async function appendCrashReport(
  kind: CrashKind,
  errorLike: unknown,
  isFatal?: boolean,
  extra?: Record<string, unknown>,
) {
  const err = toError(errorLike);
  const breadcrumbs = await readJsonArray<CrashBreadcrumb>(BREADCRUMBS_KEY);
  const next: CrashReport = {
    id: makeId("crash"),
    t: new Date().toISOString(),
    kind,
    message: err.message ?? "Unknown error",
    stack: err.stack,
    isFatal,
    extra,
    breadcrumbs: breadcrumbs.slice(-60),
  };

  const reports = await readJsonArray<CrashReport>(CRASH_REPORTS_KEY);
  const merged = [...reports, next].slice(-MAX_REPORTS);
  await writeJsonArray(CRASH_REPORTS_KEY, merged);
}

export async function getStoredCrashReports() {
  return readJsonArray<CrashReport>(CRASH_REPORTS_KEY);
}

export function captureCrashNow(
  kind: CrashKind,
  errorLike: unknown,
  extra?: Record<string, unknown>,
) {
  void appendCrashReport(kind, errorLike, kind === "js_fatal", extra);
}

function installGlobalJsHandler() {
  const errorUtils = (globalThis as any)?.ErrorUtils;
  if (!errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) return;

  previousGlobalHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    void appendCrashReport(
      isFatal ? "js_fatal" : "js_non_fatal",
      error,
      Boolean(isFatal),
    );
    if (previousGlobalHandler) {
      previousGlobalHandler(error, isFatal);
    }
  });
}

function installUnhandledPromiseHeuristic() {
  if (originalConsoleError) return;
  originalConsoleError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const text = args
        .map((x) => (typeof x === "string" ? x : ""))
        .join(" ");
      if (
        text.includes("Unhandled promise rejection") ||
        text.includes("Possible Unhandled Promise Rejection")
      ) {
        void appendCrashReport(
          "unhandled_promise_rejection",
          new Error(text || "Unhandled Promise Rejection"),
          false,
        );
      }
    } catch {
      // Ignore logging failures.
    }

    originalConsoleError?.(...args);
  };
}

export async function initCrashMonitor() {
  if (initialized) return;
  initialized = true;

  installGlobalJsHandler();
  installUnhandledPromiseHeuristic();
  await addCrashBreadcrumb("crash_monitor_initialized");
}

