import type { ReactNode } from "react";

/** Root shell — locale layout owns <html>/<body>. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
