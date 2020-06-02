// Based on config userRoles
export enum Role {
  USER,
  ADMIN,
}

export function serialize(role: Role): string {
  if (role == Role.USER) return "user";
  if (role == Role.ADMIN) return "admin";
  throw new Error(`Unknown role ${role}`);
}

export function deserialize(role: string): Role {
  if (role === "user") return Role.USER;
  if (role === "admin") return Role.ADMIN;
  throw new Error(`Unknown role [${role}]`);
}
