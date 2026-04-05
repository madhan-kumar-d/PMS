import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const CREATION_PERMISSIONS = {
  supeAdmin: ["admin", "doctor", "patient"],
  admin: ["doctor", "patient"],
};

export function withAuth(handler, allowedRoles = []) {
  return async (req, context) => {
    // 1. Try to get user from session (for internal app calls)
    const session = await getServerSession(authOptions);
    let user = session?.user;

    // 2. Try to get user from headers (set by middleware for external/bearer token calls)
    if (!user) {
      const xUser = req.headers.get("x-user");
      if (xUser) {
        try {
          user = JSON.parse(xUser);
        } catch (e) {
          console.error("Failed to parse x-user header", e);
        }
      }
    }

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.role;
    console.log(userRole);
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { message: "Forbidden: insufficient role" },
        { status: 403 },
      );
    }

    req.user = user;

    return handler(req, context);
  };
}

export function canCreate(callerRole, targetRole) {
  return CREATION_PERMISSIONS[callerRole]?.includes(targetRole) ?? false;
}
