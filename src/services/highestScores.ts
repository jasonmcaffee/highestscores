import scoreRecordFileReader from "./scoreRecordFileReader";
import {IScoreRecord} from "../models/IScoreRecord";
import {IInvalidScoreRecord} from "../models/IInvalidScoreRecord";
import {ScoreRecordWithOriginalIndex} from "../models/ScoreRecordWithWinnerClassification";

/**
 * Responsible for retrieving validated score records from the scoreRecordFileReader, sorting, and creating the subset of records to be returned.
 */
class HighestScores{
  /**
   * Read scores from the given file, sort, and create subset of records to return.
   * sort by score and duplicate score index descending, and ensure no invalid json or data is encountered only after subset has been created.
   * @param filePath - absolute file path to the file to be read.
   * @param numberOfRecords - number of records to be returned.
   */
  async getHighestScores(filePath: string, numberOfRecords: number){
    //read and parse
    const scoreRecords = await scoreRecordFileReader.readScoreRecords(filePath);
    //since we need to sort by score desc, then by index of duplicate scores desc, it's useful to maintain the original index of records.
    const scoreRecordsWithOriginalIndex = createScoreRecordsWithOriginalIndex(scoreRecords);
    //sort score desc. Based on the sample result given in the instructions, this must occur before we ensure no invalid scores.
    const sortedDesc = sortByScoreAndDuplicateScoreIndexDesc(scoreRecordsWithOriginalIndex)
      .slice(0, numberOfRecords);
    //now can we check if the results contain invalid json entries
    const noInvalidResults = ensureNoInvalidScoreRecords(sortedDesc);
    return noInvalidResults.map(mapScoreRecordToResult);
  }
}

const mapScoreRecordToResult = (scoreRecord: IScoreRecord) => ({score: scoreRecord.score, id: scoreRecord.data.id});

/**
 * Sort by scores desc, then sort by original index desc so that last entry for records duplicate scores "wins" by being on top.
 * @param scoreRecords
 */
export function sortByScoreAndDuplicateScoreIndexDesc(scoreRecords: ScoreRecordWithOriginalIndex[]){
  return scoreRecords
    .slice()
    .sort((s1, s2) => {
      if(s1.state === "invalid" || s2.state === "invalid") return 0;
      //if s2.score - s1.score is 0/false, then the scores match and we should then sort by the original index.
      return s2.score - s1.score || s2.originalIndex - s1.originalIndex;
    });
}

/**
 * throw the original error if any of the states are invalid.
 * @param scoreRecords
 */
export function ensureNoInvalidScoreRecords(scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]){
  const firstInvalidIndex = scoreRecords.findIndex(s => s.state === "invalid");
  if(firstInvalidIndex >= 0){
    throw (scoreRecords[firstInvalidIndex] as IInvalidScoreRecord).error;
  }
  return scoreRecords as IScoreRecord[];//ts doesn't recognize the above logic.  rather than use "if s.state == valid" and build a new list, we can safely cast
}

/**
 * iterate over each score record and create a new record that also has the originalIndex, which is useful in sorting records with duplicate scores.
 * @param scoreRecords
 */
const createScoreRecordsWithOriginalIndex = (scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]) =>
  scoreRecords.map((s, i) => ({...s, originalIndex: i}));

//singleton
export default new HighestScores();