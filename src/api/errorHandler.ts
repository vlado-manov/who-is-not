import { ApiError } from "./types";

type ApiErrorHandler = (error: ApiError) => void;

let currentHandler: ApiErrorHandler | null = null;

export function setApiErrorHandler(handler: ApiErrorHandler | null) {
  currentHandler = handler;
}

export function reportApiError(error: unknown) {
  if (!(error instanceof ApiError)) return;
  currentHandler?.(error);
}

