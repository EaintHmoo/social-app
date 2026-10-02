import type { ApiErrorBody } from "../types/api";


export class ApiError extends Error {
  status: number;
  /** Laravel's $errors bag: { email: ["email is required."] }. Empty unless the status is 422. */
  fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** True when the session is gone for good and the user has to log in again. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** The first message for one field, for rendering under that input. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }

  /**
   * Builds an ApiError from a failed Response.
   *
   * The body is read defensively: a 500 from a crashed process, or a proxy error page, can be
   * HTML rather than JSON, and a `.json()` that throws inside an error path would replace a
   * useful "500" with a confusing "Unexpected token < in JSON".
   */
  static async fromResponse(res: Response): Promise<ApiError> {
    let body: ApiErrorBody = {};
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // Not JSON. Fall through to the generic message below.
    }

    // Drop any undefined values so `fieldErrors[key]` is always a real array when the key exists.
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(body.errors ?? {})) {
      if (messages?.length) fieldErrors[field] = messages;
    }

    return new ApiError(res.status, body.message ?? fallbackMessage(res.status), fieldErrors);
  }
}

function fallbackMessage(status: number): string {
  if (status === 404) return "Not found.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return `Request failed (${status}).`;
}

/**
 * fetch() only rejects when the network itself fails — a wrong port, a stopped backend, no
 * connection. That arrives as a bare TypeError with a browser-specific message, so we translate
 * it into something a user can act on.
 */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

/** The message to show for anything thrown by the api layer. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (isNetworkError(err)) return "Could not reach the server. Is the backend running on port 3000?";
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
