import { Result, ok } from "../Result";
import { MemberRepository } from "./MemberRepository";
import { Member } from "./Member";
import { MemberType } from "./MemberType";

type AllMembers = {
  id: number;
  email: string;
  name: string | null;
  location: string | null;
  education: string | null;
  profession: string | null;
  member_type: string;
  gender: string | null;
  year_of_birth: number | null;
  created_at: Date;
  expiration_date: Date | null;
  employer: string | null;
}[];

function createAllMembersResponse(members: Member[]): AllMembers {
  return members.map((member) => {
    return {
      id: member.id,
      email: member.email,
      name: member.name,
      location: member.location,
      education: member.education,
      profession: member.profession,
      member_type: "student",
      gender: null,
      year_of_birth: member.yearOfBirth,
      expiration_date: member.expirationDate,
      employer: member.employer,
      created_at: member.createdAt,
    };
  });
}

export class MemberController {
  private readonly memberRepository: MemberRepository;

  constructor(memberRepository: MemberRepository) {
    this.memberRepository = memberRepository;
  }

  async all(): Promise<Result<AllMembers>> {
    const members = await this.memberRepository.all();
    return ok(createAllMembersResponse(members));
  }
}
