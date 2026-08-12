import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Exclude Sentry tunnel, API, Next internals, and static files
  matcher: "/((?!api|trpc|monitoring|_next|_vercel|.*\\..*).*)",
};
