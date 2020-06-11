import { Result, ok, fail, empty } from "../Result";
import { MemberRepository } from "./MemberRepository";
import { Member, UnsavedMember } from "./Member";
import {
  serialize as serializeMemberType,
  deserialize as deserializeMemberType,
} from "./MemberType";
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
import { UpdateMemberRequest } from "./UpdateMemberRequest";
import { ConfirmMembershipRequest } from "./ConfirmMembershipRequest";
import { processCharge2 } from "../Stripe";
import { ProductRepository } from "../product/ProductRepository";
import moment = require("moment");
import logger = require("../config/logger");
import { OutgoingMessageRepository } from "../outgoing-message/OutgoingMessageRepository";
import { OutgoingMessageFactory } from "../outgoing-message/OutgoingMessageFactory";
import { MemberTypeEntity } from "./MemberTypeEntity";

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
}[];

function createAllChaptersResponse(chapters: Chapter[]): AllChapters {
  return chapters.map((chapter) => ({
    id: chapter.id,
    name: chapter.name,
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
  chapter_id: number | null;
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
    chapter_id: member.chapterId,
  };
}

export class MemberController {
  private readonly memberRepository: MemberRepository;
  private readonly chapterRepository: ChapterRepository;
  private readonly productRepository: ProductRepository;
  private readonly outgoingMessageFactory: OutgoingMessageFactory;
  private readonly outgoingMessageRepository: OutgoingMessageRepository;

  constructor(
    memberRepository: MemberRepository,
    chapterRepository: ChapterRepository,
    productRepository: ProductRepository,
    outgoingMessageFactory: OutgoingMessageFactory,
    outgoingMessageRepository: OutgoingMessageRepository
  ) {
    this.memberRepository = memberRepository;
    this.chapterRepository = chapterRepository;
    this.productRepository = productRepository;
    this.outgoingMessageFactory = outgoingMessageFactory;
    this.outgoingMessageRepository = outgoingMessageRepository;
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
    console.log(member);
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

  async update(request: UpdateMemberRequest): Promise<Result<void>> {
    const member = await this.memberRepository.find(request.id);
    if (member == null) return fail(`Member with id ${request.id} not found`);

    member.name = request.name;
    member.location = request.location;
    member.education = request.education;
    member.profession = request.profession;
    member.memberType = deserializeMemberType(request.memberType);
    member.gender = request.gender ? deserializeGender(request.gender) : null;
    member.yearOfBirth = request.yearOfBirth;
    member.expirationDate = request.expirationDate;
    member.chapterId = request.chapterId;
    member.employer = request.employer;

    await this.memberRepository.update(member);

    return empty();
  }

  async confirmMembership(
    request: ConfirmMembershipRequest
  ): Promise<Result<void>> {
    const member = await this.memberRepository.findByEmail(request.email);
    const membership = await this.productRepository.findMembership(
      request.productId
    );
    let chapter: Chapter | null = null;
    if (request.chapterId != null) {
      chapter = await this.chapterRepository.findBy(request.chapterId);
    }

    if (membership == null)
      return fail(`Membership product with id ${request.productId} not found`);

    const memberType = await this.memberRepository.findType(
      membership.memberTypeId()
    );

    if (memberType == null)
      return fail(`Member type with id ${membership.memberTypeId()} not found`);

    let savedExpirationDate: Date | null = null;

    if (member) {
      savedExpirationDate = member.expirationDate;

      member.name = request.name;
      member.location = request.location;
      member.education = request.education;
      member.profession = request.profession;
      member.gender = request.gender ? deserializeGender(request.gender) : null;
      member.yearOfBirth = request.yearOfBirth;
      member.chapterId = chapter ? chapter.id : null;
      member.employer = request.employer;
      member.extendExpirationDate(membership.durationDays());
      member.memberType = memberType;

      await this.memberRepository.update(member);
    } else {
      const unsaved = new UnsavedMember(
        request.email,
        request.name,
        request.location,
        request.education,
        request.profession,
        membership.memberTypeId(),
        request.gender ? deserializeGender(request.gender) : null,
        request.yearOfBirth,
        moment().add(membership.durationDays(), "days").toDate(),
        chapter ? chapter.id : null,
        request.employer
      );
      await this.memberRepository.add(unsaved);
    }

    const savedMember = await this.memberRepository.findByEmail(request.email);
    // we should always have a member here
    if (savedMember == null)
      return fail("Couldn't find member after creating/updating");

    try {
      await processCharge2(
        request.stripeToken,
        membership.currencyCode,
        membership.price,
        membership.name
      );
    } catch (e) {
      logger.error(e);
      savedMember.expirationDate = savedExpirationDate;
      await this.memberRepository.update(savedMember);
      return fail("Stripe failed to process the transaction");
    }

    const receipt = this.outgoingMessageFactory.receipt(request.email, [
      membership,
    ]);
    await this.outgoingMessageRepository.enqueue(receipt);

    const welcomeMessage = this.outgoingMessageFactory.membership(
      request.email,
      savedMember.expirationDate!
    );
    await this.outgoingMessageRepository.enqueue(welcomeMessage);

    return empty();
  }

  async types(): Promise<Result<MemberTypeEntity[]>> {
    const types = await this.memberRepository.types();
    return ok(types);
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
