import nextAuthMiddleware from "next-auth/middleware";

export default nextAuthMiddleware;

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/today", "/history", "/settings"],
};
