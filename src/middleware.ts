import { NextResponse, type NextRequest } from "next/server";

/** /admin is protected with HTTP Basic auth (any username, password = ADMIN_PASSWORD). Disabled when unset. */
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return new NextResponse("Not found", { status: 404 });
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    if (supplied.length === password.length && supplied === password) return NextResponse.next();
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="The Playbook admin"' } });
}

export const config = { matcher: ["/admin/:path*", "/admin"] };
