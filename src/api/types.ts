export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "CONTRACT_MISMATCH"
  | "UNKNOWN_ERROR";

export type ApiErrorPayload = {
  statusCode?: number;
  code?: string;
  message?: string;
  traceId?: string | null;
  details?: unknown;
  timestamp?: string;
  path?: string;
};

export class ApiError extends Error {
  status: number | null;
  code: ApiErrorCode | string;
  traceId: string | null;
  details?: unknown;
  path?: string;

  constructor(input: {
    message: string;
    status?: number | null;
    code?: ApiErrorCode | string;
    traceId?: string | null;
    details?: unknown;
    path?: string;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status ?? null;
    this.code = input.code ?? "UNKNOWN_ERROR";
    this.traceId = input.traceId ?? null;
    this.details = input.details;
    this.path = input.path;
  }
}

export type RequestMeta = {
  traceId: string;
  contractId: string | null;
  contractVersion: string | null;
};
