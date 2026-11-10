import type { Instrumentation } from "next";
import { reportRequestError } from "@/lib/error-alert";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  try {
    await reportRequestError(error as Error & { digest?: string }, request, context);
  } catch {
    // Error reporting must never break request handling.
  }
};
