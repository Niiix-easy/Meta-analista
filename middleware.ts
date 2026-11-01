import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_for_dev_middleware",
});

export const config = {
  matcher: [
    "/((?!api|login|public|_next/static|_next/image|favicon.ico).*)",
  ],
};
