export enum MemberType {
  STUDENT,
  WORKING,
  SENIOR,
}

export function deserialize(s: string): MemberType {
  if (s === "student") return MemberType.STUDENT;
  if (s === "working") return MemberType.STUDENT;
  if (s === "senior") return MemberType.STUDENT;
  throw new Error(`Unknown MemberType ${s}`);
}
