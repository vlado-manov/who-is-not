import { apiGet } from "./client";
import type { IQuestion } from "../types/question";

type QuestionDto = {
  id: string;
  text: string;
  type: "pick" | "rate" | "number";
  used: number;
  isActive: boolean;
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
}): Promise<IQuestion[]> {
  const parts: string[] = [];
  if (opts?.packs?.length) {
    parts.push(`packs=${encodeURIComponent(opts.packs.join(","))}`);
  }
  if (opts?.lang) {
    parts.push(`lang=${encodeURIComponent(opts.lang)}`);
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
export async function fetchQuestionPacks(): Promise<QuestionPackDto[]> {
  const rows = await apiGet<QuestionPackDto[]>("/questions/packs", {
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
  lang?: string
): Promise<FunFactDto | null> {
  const qs = lang?.trim() ? `lang=${encodeURIComponent(lang.trim())}` : "";
  const path = qs ? `/questions/fun-fact?${qs}` : "/questions/fun-fact";

  return apiGet<FunFactDto | null>(path, {
    skipAuth: true,
    parse: parseFunFactPayload,
  });
}
