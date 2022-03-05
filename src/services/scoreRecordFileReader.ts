import events from 'events';
import fs from 'fs';
import readline from 'readline';
import {IScoreRecord, IScoreDocument} from "../models/IScoreRecord";
import {IInvalidScoreRecord} from "../models/IInvalidScoreRecord";

/**
 * Responsible for reading, parsing, and validating score records from the file system.
 */
class ScoreRecordFileReader{
  /**
   * Reads all lines from the provided filePath, attempting to parse and validate each one.
   * Lines that fail to be parsed or validated are returned as IInvalidScoreRecord.
   * @param filePath - absolute path to the file to be read.
   */
  async readScoreRecords(filePath: string){
    const linesFromFilePathAsStrings = await readFileLinesIntoArrayOfStrings(filePath);
    const result = parseScoreRecords(linesFromFilePathAsStrings);
    ensureIdsAreUnique(result);
    return result;
  }
}

const parseScoreRecords = (array: string[]) => array.map(parseScoreRecord);

/**
 * Since we must only error after we've sorted, we can't error here.  Therefore we return either a valid or invalid score record.
 * @param line - e.g. 10622876: {"umbrella": 99180, "name": "24490249af01e145437f2f64d5ddb9c04463c033", "value": 12354, "payload": "........", "date_stamp": 58874, "time": 615416, "id": "3c867674494e4a7aac9247a9d9a2179c"}
 */
export function parseScoreRecord(line: string): IScoreRecord | IInvalidScoreRecord {
  try{
    //split the string by the first ":"
    const [scoreAsString, dataAsString] = line.split(/:(.+)/);
    //parse the data and ensure it is valid.
    const score = parseValidScore(scoreAsString);
    const data = parseValidScoreDocument(dataAsString);
    return {score, data, state: "valid"};
  }catch(e: unknown){
    return {state: "invalid", error: e as Error, line};
  }
}

/**
 * Read all lines from a file, storing each line as a string into an array.
 * @param filePath - absolute path to the file to be read.
 */
async function readFileLinesIntoArrayOfStrings(filePath: string){
  try{
    const result: string[] = [];
    //setup to read each line from the file.
    const readStreamForFilePath = fs.createReadStream(filePath);
    const read = readline.createInterface({
      input: readStreamForFilePath,
      crlfDelay: Infinity,
    });
    //add each read line into
    read.on('line', (line) => {
      result.push(line);
    });
    //wait for all lines to be read.
    await events.once(read, 'close');
    return result;
  }catch(e: unknown){
    console.error(`error encountered reading file lines into array of strings: `, e);
    throw e;
  }
}

/**
 * Scores must be non-negative 32 bit integers
 * @param scoreAsString - string value of the score.
 */
function parseValidScore(scoreAsString: string){
  const score = parseInt(scoreAsString);
  if(isNaN(score)){
    throw new Error(`could not parse a number form score string: ${scoreAsString}`);
  }
  //scores are non-negative 32-bit integers
  if(!is32BitInteger(score)){
    throw new Error(`score should be a 32 bit integer, but is: ${score}`);
  }
  if(score < 0){
    throw new Error(`score should be a non-negative number, but is: ${score}`);
  }
  return score;
}

/**
 * If the line has a score that would make it part of the highest scores, then the remainder of the line _must_ be parsable as JSON, and there must be an "id" key at the top level of this JSON doc.
 * @param jsonString - string of json data to be parsed.
 */
function parseValidScoreDocument(jsonString: string): IScoreDocument{
  let scoreDocument: IScoreDocument;
  try{
    scoreDocument = JSON.parse(jsonString);
  }catch(e: unknown){
    throw new Error(`invalid json format No JSON object could be decoded\n ${jsonString}`);
  }
  if(scoreDocument.id === undefined){ throw new Error(`document is missing id property.`); }
  return scoreDocument;
}

//Convert to a signed 32-bit integer using the shift operator.  If you shift by 0 bits, the result is the first operand coerced to a 32-bit integer.
const is32BitInteger = (number: number) => number << 0 === number;

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

//singleton
export default new ScoreRecordFileReader();