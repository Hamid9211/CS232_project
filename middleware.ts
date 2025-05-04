import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("userEmail"); 

  if (req.nextUrl.pathname === "/SignInPage" || req.nextUrl.pathname === "/SignUpPage" || req.nextUrl.pathname === "/doctor-login" || req.nextUrl.pathname === "/doctor-dashboard" ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/SignInPage", req.url));
  }

  return NextResponse.next(); 
}

export const config = {
  matcher: "/((?!api|_next|static|favicon.ico).*)",
};
