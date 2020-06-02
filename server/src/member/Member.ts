import { MemberEntity } from "./MemberEntity";
import { MemberType, deserialize as deserializeMemberType } from "./MemberType";
import { Gender, deserialize as deserializeGender } from "./Gender";

export class Member {
  readonly id: number;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly name: string | null;
  readonly location: string | null;
  readonly education: string | null;
  readonly profession: string | null;
  readonly memberType: MemberType;
  readonly gender: Gender | null;
  readonly yearOfBirth: number | null;
  readonly expirationDate: Date | null;
  readonly chapterId: number | null;
  readonly employer: string | null;

  constructor(
    id: number,
    email: string,
    createdAt: Date,
    updatedAt: Date,
    name: string | null,
    location: string | null,
    education: string | null,
    profession: string | null,
    memberType: MemberType,
    gender: Gender | null,
    yearOfBirth: number | null,
    expirationDate: Date | null,
    chapterId: number | null,
    employer: string | null
  ) {
    this.id = id;
    this.email = email;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.name = name;
    this.location = location;
    this.education = education;
    this.profession = profession;
    this.memberType = memberType;
    this.gender = gender;
    this.yearOfBirth = yearOfBirth;
    this.expirationDate = expirationDate;
    this.chapterId = chapterId;
    this.employer = employer;
  }

  static fromEntity(entity: MemberEntity): Member {
    const memberType = entity.member_type
      ? deserializeMemberType(entity.member_type)
      : MemberType.STUDENT;
    const gender = entity.gender ? deserializeGender(entity.gender) : null;

    return new Member(
      entity.id,
      entity.email,
      entity.created_at,
      entity.updated_at,
      entity.name,
      entity.location,
      entity.education,
      entity.profession,
      memberType,
      gender,
      entity.year_of_birth,
      entity.expiration_date,
      entity.chapter_id,
      entity.employer
    );
  }
}
