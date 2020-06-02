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
