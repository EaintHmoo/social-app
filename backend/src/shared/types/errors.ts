// Errors Express's own middleware (body-parser, http-errors) throws with a status that is safe to
// show the client, e.g. malformed JSON → 400.
export interface ExposableHttpError extends Error {
  status: number;
  expose: true;
}
