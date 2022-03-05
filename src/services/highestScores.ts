import scoreRecordFileReader from "./scoreRecordFileReader";
import {IScoreRecord} from "../models/IScoreRecord";
import {IInvalidScoreRecord} from "../models/IInvalidScoreRecord";
import {ScoreRecordWithWinnerClassification} from "../models/ScoreRecordWithWinnerClassification";

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
    //classify whether the records are winners, then filter out only the winners, then get subset matching number of desired records
    const winnerScoreRecords = classifyWinnersForRecordsWithDuplicateScores(scoreRecords).filter(s => s.isWinner);
    //sort score desc. Based on the sample result given in the instructions, this must occur before we ensure no invalid scores.
    const sortedDesc = sortByScoreDesc(winnerScoreRecords)
      .slice(0, numberOfRecords);
    //only now can we check if the results contain invalid json entries
    //Note that one of the entries, for score `11025835`, has a document portion that is _not_ JSON. If this line was included in the result set,
    //then the program should error, but if not then it should continue. For example, if run with an N of 3 it would produce: [a valid response with no errors]
    ensureNoInvalidScoreRecords(sortedDesc);
    return sortedDesc.map(mapScoreRecordToResult);
  }
}

const mapScoreRecordToResult = (scoreRecord: IScoreRecord) => ({score: scoreRecord.score, id: scoreRecord.data.id});

export const sortByScoreDesc = (scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]) => scoreRecords
  .slice()
  .sort((s1, s2) => {
    if(s1.state === "invalid" || s2.state === "invalid") return 0;
    return s1.score < s2.score ? 1 : -1;
  });

/**
 * throw the original error if any of the states are invalid.
 * @param scoreRecords
 */
function ensureNoInvalidScoreRecords(scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]){
  const firstInvalidIndex = scoreRecords.findIndex(s => s.state === "invalid");
  if(firstInvalidIndex >= 0){
    throw (scoreRecords[firstInvalidIndex] as IInvalidScoreRecord).error;
  }
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
 * iterate over each score record and determine if it is a winner by checking if it is the last index with the score.
 * invalid (failed to be parsed records) are classified as winners since they do not have scores.
 * @param scoreRecords
 */
export function classifyWinnersForRecordsWithDuplicateScores(scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]){
  const results: ScoreRecordWithWinnerClassification[] = scoreRecords.map((s, i) => {
    //if valid, and the index of last record with same score matches this index, then consider the record a winner.
    const isWinner = s.state === "valid" ? indexOfLastRecordWithScore(s.score, scoreRecords) === i : true;
    return {...s, isWinner};
  });
  return results;
}

/**
 * Find the last index of the given score so we can determine which of the duplicates is considered a winner.
 * @param score
 * @param scoreRecords
 */
export const indexOfLastRecordWithScore = (score: number, scoreRecords: (IScoreRecord | IInvalidScoreRecord)[]) =>
  findLastIndex(scoreRecords, (s => s.state === "valid" && s.score === score));

/**
 * Find the last index in the array which matches the predicate by iterating backwards through the array.
 * @param array
 * @param predicate
 */
export function findLastIndex<T>(array: Array<T>, predicate: (value: T) => boolean){
  let i = array.length; //start at the end and loop backwards
  while(i--){
    const item = array[i];
    if (predicate(item)){ //if predicate is true, return the index.
      return i;
    }
  }
  return -1;
}

//singleton
export default new HighestScores();