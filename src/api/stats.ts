import { apiGet } from "./client";

export type GlobalStatsDto = {
  gamesStarted: number;
  gamesFinished: number;
  totalRounds: number;
  totalGameDurationMs: string;
};

export type KpisDto = {
  averageGameDurationMs: number;
  averageRoundsPerGame: number;
  completionRate: number;
  dropOffRate: number;
};

export async function getGlobalStats() {
  return apiGet<GlobalStatsDto>("/analytics/global");
}

export async function getKpis() {
  return apiGet<KpisDto>("/analytics/kpis");
}
