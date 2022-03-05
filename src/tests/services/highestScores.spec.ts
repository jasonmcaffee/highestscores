import test from 'ava';
import highestScores, {
  ensureNoInvalidScoreRecords,
  sortByScoreAndDuplicateScoreIndexDesc
} from "../../services/highestScores";
import {IScoreRecord} from "../../models/IScoreRecord";
import {ScoreRecordWithOriginalIndex} from "../../models/ScoreRecordWithWinnerClassification";
import {IInvalidScoreRecord} from "../../models/IInvalidScoreRecord";

test(`highestScores`, async (t) => {
  const example1FilePath = `${process.cwd()}/testDataFiles/example-1.data`;
  const result = await highestScores.getHighestScores(example1FilePath, 3);
  t.is(result.length, 3);
  const [one, two, three] = result;
  t.is(one.id, "085a11e1b82b441184f4a193a3c9a13c");
  t.is(one.score, 13214012);
  t.is(two.id, "84a0ccfec7d1475b8bfcae1945aea8f0");
  t.is(two.score, 11446512);
  t.is(three.id, "7ec85fe3aa3c4dd599e23111e7abf5c1");
  t.is(three.score, 11269569);
});

test(`sortByScoreAndDuplicateScoreIndexDesc`, (t) => {
  const scoreRecords: ScoreRecordWithOriginalIndex[] = [
    {score: 1, state: "valid", data: {id: "c"}, originalIndex: 0},
    {score: 2, state: "valid", data: {id: "b"}, originalIndex: 1},
    {score: 1, state: "valid", data: {id: "d"}, originalIndex: 2},
    {score: 3, state: "valid", data: {id: "a"}, originalIndex: 3},
  ];
  const result = sortByScoreAndDuplicateScoreIndexDesc(scoreRecords);
  const [one, two, three, four] = result;
  t.is((one as IScoreRecord).data.id, "a");
  t.is((two as IScoreRecord).data.id, "b");
  t.is((three as IScoreRecord).data.id, "d");
  t.is((four as IScoreRecord).data.id, "c");
});

test(`ensureNoInvalidScoreRecords`, (t) => {
  const scoreRecords: (IScoreRecord | IInvalidScoreRecord)[] = [
    {score: 1, state: "valid", data: {id: "c"}},
    {state: "invalid", error: new Error('no bueno'), line:`no bueno json`},
  ];
  t.throws(() => ensureNoInvalidScoreRecords(scoreRecords), null,  `no bueno json`);
});