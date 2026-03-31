import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const CREATION_PERMISSIONS = {
  supeAdmin: ["admin", "doctor", "patient"],
  admin: ["doctor", "patient"],
};

export function withAuth(handler, allowedRoles = []) {
  return async (req, context) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return Response.json({ message: "Forbidden: insufficient role" }, { status: 403 });
    }

    req.user = session.user;

    return handler(req, context);
  };
}

export function canCreate(callerRole, targetRole) {
  return CREATION_PERMISSIONS[callerRole]?.includes(targetRole) ?? false;
}
