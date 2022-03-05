import test from 'ava';
import highestScores, {
  indexOfLastRecordWithScore,
  classifyWinnersForRecordsWithDuplicateScores,
  ensureIdsAreUnique,
  sortByScoreDesc
} from "../../services/highestScores";
import {IScoreRecord} from "../../models/IScoreRecord";
import {IInvalidScoreRecord} from "../../models/IInvalidScoreRecord";

test('indexOfLastRecordWithScore', (t) => {
  const scoreRecords: IScoreRecord[] = [
    {score: 1, state: "valid", data: {id: "a"}},
    {score: 1, state: "valid", data: {id: "b"}},
    {score: 2, state: "valid", data: {id: "a"}},
    {score: 3, state: "valid", data: {id: "a"}},
    {score: 2, state: "valid", data: {id: "c"}},
  ];
  const r1 = indexOfLastRecordWithScore(1, scoreRecords);
  const r2 = indexOfLastRecordWithScore(2, scoreRecords);
  t.is(r1, 1);
  t.is(r2, 4);
});

test('classifyWinnersForRecordsWithDuplicateScores', (t) => {
  const scoreRecords: (IScoreRecord | IInvalidScoreRecord)[] = [
    {score: 1, state: "valid", data: {id: "a"}},
    {score: 1, state: "valid", data: {id: "b"}},
    {score: 2, state: "valid", data: {id: "a"}},
    {score: 3, state: "valid", data: {id: "a"}},
    {state: "invalid", error: new Error(), line: ``},
    {score: 2, state: "valid", data: {id: "c"}},
  ];
  const classifiedWinners = classifyWinnersForRecordsWithDuplicateScores(scoreRecords);
  const [one, two, three, four, five, six] = classifiedWinners;
  t.is(one.isWinner, false);
  t.is(two.isWinner, true);
  t.is(three.isWinner, false);
  t.is(four.isWinner, true);
  t.is(five.isWinner, true);
  t.is(six.isWinner, true);
});

test('ensureIdsAreUnique throws when duplicate ids are encountered', (t) => {
  const scoreRecords: (IScoreRecord | IInvalidScoreRecord)[] = [
    {score: 1, state: "valid", data: {id: "a"}},
    {score: 1, state: "valid", data: {id: "a"}},
  ];
  t.throws(()=> ensureIdsAreUnique(scoreRecords), null, `ids are not unique across the data set`);
});

test(`sort scores desc`, (t) =>{
  const scoreRecords: IScoreRecord[] = [
    {score: 1, state: "valid", data: {id: "a"}},
    {score: 2, state: "valid", data: {id: "b"}},
    {score: 3, state: "valid", data: {id: "c"}},
    {score: 4, state: "valid", data: {id: "d"}},
    {score: 5, state: "valid", data: {id: "e"}},
  ];
  const sorted = sortByScoreDesc(scoreRecords);
  t.is(sorted[0], scoreRecords[4]);
  t.is(sorted[1], scoreRecords[3]);
  t.is(sorted[2], scoreRecords[2]);
  t.is(sorted[3], scoreRecords[1]);
  t.is(sorted[4], scoreRecords[0]);
});

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