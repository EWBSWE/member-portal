import { Result, ok, fail, empty } from "../Result";
import { MemberRepository } from "./MemberRepository";
import { Member, UnsavedMember } from "./Member";
import { serialize as serializeMemberType } from "./MemberType";
import { Chapter } from "./Chapter";
import {
  serialize as serializeGender,
  deserialize as deserializeGender,
} from "./Gender";
import { ChapterRepository } from "./ChapterRepository";
import { ShowMemberRequest } from "./ShowMemberRequest";
import { CreateMemberRequest } from "./CreateMemberRequest";
import { BulkCreateRequest } from "./BulkCreateRequest";
import { groupBy, mapBy } from "../util";

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

type ShowMember = {
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
};

function createShowMemberResponse(member: Member): ShowMember {
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

  async show(request: ShowMemberRequest): Promise<Result<ShowMember>> {
    const member = await this.memberRepository.find(request.id);
    if (member == null) return fail(`Member with id ${request.id} not found`);
    return ok(createShowMemberResponse(member));
  }

  async create(request: CreateMemberRequest): Promise<Result<ShowMember>> {
    const member = await this.memberRepository.findByEmail(request.email);
    if (member != null)
      return fail(`Member with email ${request.email} exists`);

    const unsaved = new UnsavedMember(
      request.email,
      request.name,
      request.location,
      request.education,
      request.profession,
      request.memberTypeId,
      request.gender ? deserializeGender(request.gender) : null,
      request.yearOfBirth,
      request.expirationDate,
      request.chapterId,
      request.employer
    );

    const saved = await this.memberRepository.add(unsaved);
    return ok(createShowMemberResponse(saved));
  }

  async bulkCreate(
    request: BulkCreateRequest
  ): Promise<Result<BulkCreateResponse>> {
    const emails = request.members.map((member) => member.email);
    const existing = await this.memberRepository.findByEmails(emails);
    const existingMemberByEmail = mapBy(
      existing,
      (member: Member) => member.email
    );

    const unsaved = request.members
      .filter((member) => !existingMemberByEmail.has(member.email))
      .map(
        (member) =>
          new UnsavedMember(
            member.email,
            member.name,
            member.location,
            member.education,
            member.profession,
            member.memberTypeId,
            member.gender ? deserializeGender(member.gender) : null,
            member.yearOfBirth,
            member.expirationDate,
            null, // TODO: chapter id not supported by bulk create
            null // TODO: employer not supported by bulk create
          )
      );

    const saved = await this.memberRepository.addAll(unsaved);

    return ok(createBulkCreateResponse(saved, existing));
  }
}

type BulkCreateResponse = {
  existing: {
    id: number;
    email: string;
    name: string | null;
    location: string | null;
    education: string | null;
    profession: string | null;
    memberType: string;
    gender: string | null;
    yearOfBirth: number | null;
    expirationDate: Date | null;
  }[];
  created: {
    id: number;
    email: string;
    name: string | null;
    location: string | null;
    education: string | null;
    profession: string | null;
    memberType: string;
    gender: string | null;
    yearOfBirth: number | null;
    expirationDate: Date | null;
  }[];
};

function createBulkCreateResponse(
  created: Member[],
  existing: Member[]
): BulkCreateResponse {
  const formatMember = (member: Member) => ({
    id: member.id,
    email: member.email,
    name: member.name,
    location: member.location,
    education: member.education,
    profession: member.profession,
    memberType: serializeMemberType(member.memberType),
    gender: member.gender ? serializeGender(member.gender) : null,
    yearOfBirth: member.yearOfBirth,
    expirationDate: member.expirationDate,
  });

  return {
    created: created.map(formatMember),
    existing: existing.map(formatMember),
  };
}
