export interface IScoreRecord {
  state: "valid",
  score: number,
  data: IScoreDocument,
}

export interface IScoreDocument{
  id: string,
}