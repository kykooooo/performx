import type { LegacyUserRole, UserRole } from "./types";

export function normalizeUserRole(role: LegacyUserRole | string | null | undefined): UserRole | null {
  if (!role) return null;
  if (role === "club") return "parent";
  if (role === "player" || role === "coach" || role === "parent") {
    return role;
  }
  return null;
}

export function getDashboardPathForRole(role: LegacyUserRole | string | null | undefined) {
  switch (normalizeUserRole(role)) {
    case "coach":
      return "/dashboard/coach";
    case "parent":
      return "/dashboard/parent";
    case "player":
    default:
      return "/dashboard/player";
  }
}

export function isParentRole(role: LegacyUserRole | string | null | undefined) {
  return normalizeUserRole(role) === "parent";
}
