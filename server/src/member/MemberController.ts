import { Result, ok } from "../Result";
import { MemberRepository } from "./MemberRepository";
import { Member } from "./Member";
import { serialize as serializeMemberType } from "./MemberType";
import { Chapter } from "./Chapter";
import { serialize as serializeGender } from "./Gender";
import { ChapterRepository } from "./ChapterRepository";

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
      member_type: serializeMemberType(member.memberType),
      gender: member.gender ? serializeGender(member.gender) : null,
      year_of_birth: member.yearOfBirth,
      expiration_date: member.expirationDate,
      employer: member.employer,
      created_at: member.createdAt,
    };
  });
}

type AllChapters = {
  id: number;
  name: string;
  memberType: string;
  memberTypeId: number;
}[];

function createAllChaptersResponse(chapters: Chapter[]): AllChapters {
  return chapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
    memberType: serializeMemberType(chapter.memberType),
    memberTypeId: chapter.memberTypeId,
  }));
}

export class MemberController {
  private readonly memberRepository: MemberRepository;
  private readonly chapterRepository: ChapterRepository;

  constructor(
    memberRepository: MemberRepository,
    chapterRepository: ChapterRepository
  ) {
    this.memberRepository = memberRepository;
    this.chapterRepository = chapterRepository;
  }

  async all(): Promise<Result<AllMembers>> {
    const members = await this.memberRepository.all();
    return ok(createAllMembersResponse(members));
  }

  async chapters(): Promise<Result<AllChapters>> {
    const chapters = await this.chapterRepository.all();
    return ok(createAllChaptersResponse(chapters));
  }
}
