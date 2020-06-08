import { MemberRepository } from "../member/MemberRepository";
import { ok, Result } from "../Result";
import { Gender, serialize } from "../member/Gender";
import { MemberType } from "../member/MemberType";

export class StatsController {
  private readonly memberRepository: MemberRepository;

  constructor(memberRepository: MemberRepository) {
    this.memberRepository = memberRepository;
  }

  async members(): Promise<Result<MemberStatsResponse>> {
    const members = await this.memberRepository.findActive();

    const total = members.length;
    const memberTypes = new Map<MemberType, number>();
    const birthYears = new Map<number, number>();
    let unknownYearCounter = 0;
    const genders = new Map<Gender, number>();
    let unknownGenderCounter = 0;
    const locations = new Map<string, number>();
    let unknownLocationCounter = 0;

    members.forEach((member) => {
      const memberTypeCounter = memberTypes.get(member.memberType) || 0;
      memberTypes.set(member.memberType, memberTypeCounter + 1);

      if (member.gender != null) {
        const genderCounter = genders.get(member.gender) || 0;
        genders.set(member.gender, genderCounter + 1);
      } else {
        unknownGenderCounter++;
      }

      if (member.yearOfBirth != null) {
        const yearCounter = birthYears.get(member.yearOfBirth) || 0;
        birthYears.set(member.yearOfBirth, yearCounter + 1);
      } else {
        unknownYearCounter++;
      }

      if (member.location != null) {
        const locationCounter = locations.get(member.location) || 0;
        locations.set(member.location, locationCounter + 1);
      } else {
        unknownLocationCounter++;
      }
    });

    const result: MemberStatsResponse = {
      members: {
        total,
        student: memberTypes.get(MemberType.STUDENT) || 0,
        working: memberTypes.get(MemberType.WORKING) || 0,
        senior: memberTypes.get(MemberType.SENIOR) || 0,
        birthYears: {
          unknown: unknownYearCounter,
        },
        genders: {
          female: genders.get(Gender.FEMALE) || 0,
          male: genders.get(Gender.MALE) || 0,
          other: genders.get(Gender.OTHER) || 0,
          unknown: unknownGenderCounter,
        },
        locations: {
          unknown: unknownLocationCounter,
        },
      },
    };

    locations.forEach((count: number, location: string) => {
      result.members.locations[location] = count;
    });

    birthYears.forEach((count: number, year: number) => {
      result.members.birthYears[year] = count;
    });

    return ok(result);
  }
}

type MemberStatsResponse = {
  members: {
    total: number;
    student: number;
    senior: number;
    working: number;
    birthYears: {
      [key: number]: number;
      unknown: number;
    };
    genders: {
      female: number;
      male: number;
      other: number;
      unknown: number;
    };
    locations: {
      [key: string]: number;
      unknown: number;
    };
  };
};
