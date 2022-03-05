import scoreRecordFileReader from "./scoreRecordFileReader";
import {IScoreRecord} from "../models/IScoreRecord";
import {IInvalidScoreRecord} from "../models/IInvalidScoreRecord";
import {ScoreRecordWithOriginalIndex} from "../models/ScoreRecordWithWinnerClassification";

class HighestScores{
  /**
   * Read scores from the given file, ensure ids are unique, determine which records with duplicate score "wins",
   * sort by score descending, and ensure no invalid json or data is encountered.
   * @param filePath - absolute file path to the file to be read.
   * @param numberOfRecords - number of records to be returned.
   */
  async getHighestScores(filePath: string, numberOfRecords: number){
    //read and parse
    const scoreRecords = await scoreRecordFileReader.readScoreRecords(filePath);
    //ids should be unique across the data set
    ensureIdsAreUnique(scoreRecords);
    //since we need to sort by score desc, then by index of duplicate scores desc, it's useful to maintain the original index of records.
    const scoreRecordsWithOriginalIndex = createScoreRecordsWithOriginalIndex(scoreRecords);
    //sort score desc. Based on the sample result given in the instructions, this must occur before we ensure no invalid scores.
    const sortedDesc = sortByScoreAndDuplicateScoreIndexDesc(scoreRecordsWithOriginalIndex)
      .slice(0, numberOfRecords);
    //only now can we check if the results contain invalid json entries
    //Note that one of the entries, for score `11025835`, has a document portion that is _not_ JSON. If this line was included in the result set,
    //then the program should error, but if not then it should continue. For example, if run with an N of 3 it would produce: [a valid response with no errors]
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
function ensureNoInvalidScoreRecords(scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]){
  const firstInvalidIndex = scoreRecords.findIndex(s => s.state === "invalid");
  if(firstInvalidIndex >= 0){
    throw (scoreRecords[firstInvalidIndex] as IInvalidScoreRecord).error;
  }
  return scoreRecords as IScoreRecord[];//ts doesn't recognize the above logic.  rather than use "if s.state == valid" and build a new list, we can safely cast
}

/**
 * Ids should be unique across the data set.
 * @param scoreRecords - array of score records to evaluate the ids of.
 */
export function ensureIdsAreUnique(scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]){
  const idSet = new Set();
  const validRecords = scoreRecords.filter(scoreRecord => scoreRecord.state === "valid");
  validRecords.forEach(scoreRecord => idSet.add((scoreRecord as IScoreRecord).data.id));
  if(idSet.size != validRecords.length){
    throw new Error(`ids are not unique across the data set`);
  }
}

/**
 * iterate over each score record and create a new record that also has the originalIndex, which is useful in sorting records with duplicate scores.
 * @param scoreRecords
 */
export const createScoreRecordsWithOriginalIndex = (scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]) =>
  scoreRecords.map((s, i) => ({...s, originalIndex: i}));

//singleton
export default new HighestScores();