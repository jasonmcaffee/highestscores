import {IInvalidScoreRecord} from "./IInvalidScoreRecord";
import {IScoreRecord} from "./IScoreRecord";

export interface IWithOriginalIndex {
  originalIndex: number,
}

export type ScoreRecordWithOriginalIndex = (IScoreRecord | IInvalidScoreRecord) & IWithOriginalIndex;