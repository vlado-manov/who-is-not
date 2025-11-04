import { IPack } from "./pack";

export interface IQuestion {
  id: string;
  text: string;
  type: string;
  used: boolean;
  active: boolean;
  pack?: IPack;
  tr_bg?: string;
  tr_fr?: string;
  tr_es?: string;
}
