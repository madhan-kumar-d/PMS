/**
 * Role hierarchy for creation permissions:
 *  supeAdmin → can create admin, doctor, patient
 *  admin     → can create doctor, patient
 *  doctor    → no creation rights
 *  patient   → no creation rights
 */
const CREATION_PERMISSIONS = {
  supeAdmin: ["admin", "doctor", "patient"],
  admin: ["doctor", "patient"],
};

/**
 * withAuth(handler, allowedRoles?)
 *
 * Route handler wrapper for role-based authorization.
 * Expects middleware.js to have already validated the bearer token.
 * User data is passed via headers: x-user-id, x-user-role, x-user
 *
 * If `allowedRoles` is provided, only users with those roles can proceed.
 *
 * Usage:
 *   export const POST = withAuth(async (req) => { ... }, ["admin", "supeAdmin"]);
 */
export function withAuth(handler, allowedRoles = []) {
  return async (req, context) => {
    const userRole = req.headers.get("x-user-role");
    const userHeader = req.headers.get("x-user");

    if (!userRole || !userHeader) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return Response.json({ message: "Forbidden: insufficient role" }, { status: 403 });
    }

    // Parse user from header for handler access
    const user = JSON.parse(userHeader);
    req.user = user;

    return handler(req, context);
  };
}

/**
 * canCreate(callerRole, targetRole)
 *
 * Returns true if the caller is allowed to create an account with targetRole.
 */
export function canCreate(callerRole, targetRole) {
  return CREATION_PERMISSIONS[callerRole]?.includes(targetRole) ?? false;
}
