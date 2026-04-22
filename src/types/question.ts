import { IPack } from "./pack";

export type QuestionTypeApi = "pick" | "rate" | "number" | "input";

export interface IQuestion {
  id: string;
  text: string;
  type: QuestionTypeApi;
  /** Number of times this question has been used (globally). */
  used: number;
  isActive: boolean;
  /** Questions sharing any group (and type) are related - odd one is picked from this pool. */
  relatedGroupIds?: string[];
  pack?: IPack;
  tr_bg?: string;
  tr_fr?: string;
  tr_es?: string;
}
