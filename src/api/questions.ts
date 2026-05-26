import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { IQuestion, QuestionTypeApi } from "../types/question";

type QuestionDto = {
  id: string;
  text: string;
  type: QuestionTypeApi;
  used: number;
  isActive: boolean;
  packSlug: string;
  relatedGroupIds: string[];
};

function parsePayload(input: unknown): QuestionDto[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid /questions payload: expected array");
  }
  return input as QuestionDto[];
}

function toQuestion(d: QuestionDto): IQuestion {
  return {
    id: d.id,
    text: d.text,
    type: d.type,
    used: d.used,
    isActive: d.isActive,
    packSlug: d.packSlug,
    relatedGroupIds: d.relatedGroupIds?.length ? d.relatedGroupIds : undefined,
  };
}

/**
 * Fetch questions for the game from backend. Use when backend question-packs are the source of truth.
 * Query params: packs (comma-separated slugs, e.g. main,chaos), lang (en|bg|fr|es).
 */
export async function fetchQuestions(opts?: {
  packs?: string[];
  lang?: string;
  userId?: string;
}): Promise<IQuestion[]> {
  const parts: string[] = [];
  if (opts?.packs?.length) {
    parts.push(`packs=${encodeURIComponent(opts.packs.join(","))}`);
  }
  if (opts?.lang) {
    parts.push(`lang=${encodeURIComponent(opts.lang)}`);
  }
  if (opts?.userId) {
    parts.push(`userId=${encodeURIComponent(opts.userId)}`);
  }
  const qs = parts.join("&");
  const path = qs ? `/questions?${qs}` : "/questions";

  const rows = await apiGet<QuestionDto[]>(path, {
    skipAuth: true,
    parse: parsePayload,
  });

  return rows.map(toQuestion);
}

export type QuestionPackDto = {
  slug: string;
  title: string;
  questionsCount: number;
};

function parsePacksPayload(input: unknown): QuestionPackDto[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid /questions/packs payload: expected array");
  }
  return input as QuestionPackDto[];
}

/**
 * Fetch question packs that have questions (for game settings). Only these can be selected.
 */
export async function fetchQuestionPacks(opts?: {
  userId?: string;
}): Promise<QuestionPackDto[]> {
  const qs = opts?.userId ? `?userId=${encodeURIComponent(opts.userId)}` : "";
  const rows = await apiGet<QuestionPackDto[]>(`/questions/packs${qs}`, {
    skipAuth: true,
    parse: parsePacksPayload,
  });
  return rows;
}

export type FunFactDto = {
  id: string;
  text: string;
  language: "english" | "french" | "spanish" | "bulgarian";
};

function parseFunFactPayload(input: unknown): FunFactDto | null {
  if (input == null) return null;
  if (typeof input !== "object") {
    throw new Error("Invalid /questions/fun-fact payload: expected object");
  }
  const row = input as FunFactDto;
  if (typeof row.text !== "string") {
    throw new Error("Invalid /questions/fun-fact payload: missing text");
  }
  return row;
}

export async function fetchRandomFunFact(
  lang?: string,
  opts?: { seed?: string }
): Promise<FunFactDto | null> {
  const parts: string[] = [];
  if (lang?.trim()) {
    parts.push(`lang=${encodeURIComponent(lang.trim())}`);
  }
  if (opts?.seed?.trim()) {
    parts.push(`seed=${encodeURIComponent(opts.seed.trim())}`);
  }
  const qs = parts.join("&");
  const path = qs ? `/questions/fun-fact?${qs}` : "/questions/fun-fact";

  return apiGet<FunFactDto | null>(path, {
    skipAuth: true,
    parse: parseFunFactPayload,
  });
}

export type CustomQuestionDto = {
  id: string;
  type: "pick" | "number" | "rate" | "input";
  text: string;
  textBg?: string;
  textFr?: string;
  textEs?: string;
  isActive: boolean;
  relatedGroupIds?: string[];
};

export type CustomQuestionPackSummaryDto = {
  hasCustomPack: boolean;
  isPremium?: boolean;
  counts?: Record<"pick" | "number" | "rate" | "input", number>;
  limits: { perType: number };
};

export async function fetchUserCustomPackSummary(userId: string) {
  return apiGet<CustomQuestionPackSummaryDto>(`/users/${encodeURIComponent(userId)}/custom-pack`, {
    skipAuth: true,
  });
}

export async function fetchUserCustomQuestions(userId: string, type?: string) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  return apiGet<{ items: CustomQuestionDto[] }>(
    `/users/${encodeURIComponent(userId)}/custom-questions${qs}`,
    { skipAuth: true },
  );
}

export async function createUserCustomQuestion(
  userId: string,
  input: Omit<CustomQuestionDto, "id" | "isActive"> & { isActive?: boolean },
) {
  return apiPost<CustomQuestionDto>(
    `/users/${encodeURIComponent(userId)}/custom-questions`,
    input,
    { skipAuth: true },
  );
}

export async function updateUserCustomQuestion(
  userId: string,
  questionId: string,
  input: Partial<Omit<CustomQuestionDto, "id">>,
) {
  return apiPatch<CustomQuestionDto>(
    `/users/${encodeURIComponent(userId)}/custom-questions/${encodeURIComponent(questionId)}`,
    input,
    { skipAuth: true },
  );
}

export async function deleteUserCustomQuestion(userId: string, questionId: string) {
  return apiDelete<{ success: boolean }>(
    `/users/${encodeURIComponent(userId)}/custom-questions/${encodeURIComponent(questionId)}`,
    { skipAuth: true },
  );
}
