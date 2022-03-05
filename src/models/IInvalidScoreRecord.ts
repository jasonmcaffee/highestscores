export interface IInvalidScoreRecord {
  state: "invalid",
  error: Error,
  line: string,
}