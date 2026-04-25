export type AuthRole = "ADMIN" | "KITCHEN";

export type AuthUserStatus = "ACTIVE" | "DISABLED";

export type SessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type LoginEventResult = "SUCCESS" | "FAILURE" | "LOCKED";

export type AuthUser = {
  id: string;
  restaurantId: string;
  username: string;
  displayName: string;
  status: AuthUserStatus;
  roles: AuthRole[];
};

export type AuthSession = {
  id: string;
  restaurantId: string;
  user: AuthUser;
  expiresAt: string;
};
