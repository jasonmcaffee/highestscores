import test from 'ava';

import scoreRecordFileReader, {parseScoreRecord} from '../../services/scoreRecordFileReader';
import {IInvalidScoreRecord} from "../../models/IInvalidScoreRecord";

test('parseScoreRecord handles valid entries', (t) => {
  const line = `10622876: {"umbrella": 99180, "name": "24490249af01e145437f2f64d5ddb9c04463c033", "value": 12354, "payload": "........", "date_stamp": 58874, "time": 615416, "id": "3c867674494e4a7aac9247a9d9a2179c"}`
  const result = parseScoreRecord(line);
  if(result.state == "valid"){
    t.is(result.data.id, "3c867674494e4a7aac9247a9d9a2179c");
    t.is(result.score, 10622876);
  }else{
    t.fail("failed to parse valid line entry correctly");
  }
});

test('parseScoreRecord handles invalid scores', (t) => {
  const lineWithNon32BitIntegerScore = `${Number.MAX_SAFE_INTEGER}: {"umbrella": 99180, "name": "24490249af01e145437f2f64d5ddb9c04463c033", "value": 12354, "payload": "........", "date_stamp": 58874, "time": 615416, "id": "3c867674494e4a7aac9247a9d9a2179c"}`
  const lineWithNegativeScore = `-123: {"umbrella": 99180, "name": "24490249af01e145437f2f64d5ddb9c04463c033", "value": 12354, "payload": "........", "date_stamp": 58874, "time": 615416, "id": "3c867674494e4a7aac9247a9d9a2179c"}`
  const r1 = parseScoreRecord(lineWithNon32BitIntegerScore);
  const r2 = parseScoreRecord(lineWithNegativeScore);

  t.is(r1.state, "invalid");
  t.is(r2.state, "invalid");
  if(r1.state === "invalid" && r2.state === "invalid"){
    t.is(r1.error.message, `score should be a 32 bit integer, but is: 9007199254740991`);
    t.is(r2.error.message, `score should be a non-negative number, but is: -123`);
  }
});

test('parseScoreRecord handles when id is not included', (t) => {
  const lineWithoutId = `10622876: {"umbrella": 99180, "name": "24490249af01e145437f2f64d5ddb9c04463c033", "value": 12354, "payload": "........", "date_stamp": 58874, "time": 615416, "notTheId": "3c867674494e4a7aac9247a9d9a2179c"}`;
  const result = parseScoreRecord(lineWithoutId);
  t.is(result.state, "invalid");
  t.is((result as IInvalidScoreRecord).error.message, `document is missing id property.`);
});

test('parseScoreRecord json is invalid', (t) => {
  const line = `10622876:THIS IS NOT JSON`;
  const result = parseScoreRecord(line);
  t.is(result.state, "invalid");
  t.is((result as IInvalidScoreRecord).error.message, `invalid json format No JSON object could be decoded\n THIS IS NOT JSON`);
});

test(`read files`, async (t) => {
  const example1FilePath = `${process.cwd()}/testDataFiles/example-1.data`;
  const records = await scoreRecordFileReader.readScoreRecords(example1FilePath);
  t.is(records.length, 6);
  const [one, two, three, four, five, six] = records;
  t.is(one.state, "valid");
  t.is(two.state, "valid");
  t.is(three.state, "valid");
  t.is(four.state, "invalid");
  t.is(five.state, "valid");
  t.is(six.state, "valid");
  t.is((four as IInvalidScoreRecord).line, `11025835: === THIS IS NOT JSON and should error if this line is part of the result set, but is ok if it not ==`);
});

