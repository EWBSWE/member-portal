export enum Gender {
  FEMALE,
  MALE,
  OTHER,
}

export function deserialize(s: string): Gender {
  if (s === "female") return Gender.FEMALE;
  if (s === "male") return Gender.MALE;
  if (s === "other") return Gender.OTHER;
  throw new Error(`Unknown Gender ${s}`);
}

export function serialize(gender: Gender): string {
  if (gender == Gender.FEMALE) return "female";
  if (gender == Gender.MALE) return "male";
  if (gender == Gender.OTHER) return "other";
  throw new Error(`Unknown Gender ${gender}`);
}
