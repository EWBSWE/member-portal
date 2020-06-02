export enum MemberType {
  STUDENT,
  WORKING,
  SENIOR,
}

export function deserialize(s: string): MemberType {
  if (s === "student") return MemberType.STUDENT;
  if (s === "working") return MemberType.WORKING;
  if (s === "senior") return MemberType.SENIOR;
  throw new Error(`Unknown MemberType ${s}`);
}

export function serialize(member: MemberType): string {
  if (member == MemberType.STUDENT) return "student";
  if (member == MemberType.WORKING) return "working";
  if (member == MemberType.SENIOR) return "senior";
  throw new Error(`Unknown MemberType ${member}`);
}
