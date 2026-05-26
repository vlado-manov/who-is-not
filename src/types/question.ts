import { IPack } from "./pack";

export type QuestionTypeApi = "pick" | "rate" | "number" | "input";

export interface IQuestion {
  id: string;
  text: string;
  type: QuestionTypeApi;
  /** Number of times this question has been used (globally). */
  used: number;
  isActive: boolean;
  /** Source question pack slug used for round pairing logic. */
  packSlug?: string;
  /** Related pairing uses an exact same-group set match for the same question type. */
  relatedGroupIds?: string[];
  pack?: IPack;
  tr_bg?: string;
  tr_fr?: string;
  tr_es?: string;
}
