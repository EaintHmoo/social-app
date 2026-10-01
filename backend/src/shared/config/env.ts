// Reads a variable that the app cannot run without. Called lazily (when the value is first needed)
// rather than at import time, so a missing variable surfaces as a normal thrown error.
export function requireEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
