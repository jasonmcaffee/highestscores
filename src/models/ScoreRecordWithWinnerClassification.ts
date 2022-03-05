import {IInvalidScoreRecord} from "./IInvalidScoreRecord";
import {IScoreRecord} from "./IScoreRecord";

export interface IScoreRecordWinnerClassification {
  isWinner: boolean,
}

export type ScoreRecordWithWinnerClassification = (IScoreRecord | IInvalidScoreRecord) & IScoreRecordWinnerClassification;