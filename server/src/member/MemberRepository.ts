import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { MemberEntity } from "./MemberEntity";
import { Member, UnsavedMember } from "./Member";
import { MemberType, deserialize } from "./MemberType";

export class MemberRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;
  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async all(): Promise<Member[]> {
    const result = await this.db.many<MemberEntity>(this.sqlProvider.Members);
    return result.map(Member.fromEntity);
  }

  async find(id: number): Promise<Member | null> {
    const result = await this.db.oneOrNone<MemberEntity>(
      this.sqlProvider.MemberById,
      id
    );
    if (result == null) return null;
    return Member.fromEntity(result);
  }

  async findByEmail(email: string): Promise<Member | null> {
    const result = await this.db.oneOrNone<MemberEntity>(
      this.sqlProvider.MemberByEmail,
      email
    );
    if (result == null) return null;
    return Member.fromEntity(result);
  }

  async findByEmails(emails: string[]): Promise<Member[]> {
    const result = await this.db.any<MemberEntity>(
      this.sqlProvider.MemberByEmails,
      [emails]
    );
    return result.map(Member.fromEntity);
  }

  async add(unsaved: UnsavedMember): Promise<Member> {
    const result = await this.addAll([unsaved]);
    return result[0];
  }

  async addAll(members: UnsavedMember[]): Promise<Member[]> {
    const createParams = (unsaved: UnsavedMember) => [
      unsaved.email,
      unsaved.location,
      unsaved.name,
      unsaved.education,
      unsaved.profession,
      unsaved.memberTypeId,
      unsaved.expirationDate,
      unsaved.chapterId,
      unsaved.employer,
      unsaved.yearOfBirth,
    ];

    const saved = await this.db.task((t) =>
      Promise.all(
        members.map((unsaved) => {
          const params = createParams(unsaved);
          return t.one<MemberEntity>(this.sqlProvider.MemberInsert, params);
        })
      )
    );

    return saved.map(Member.fromEntity);
  }

  async update(member: Member): Promise<Member> {
    const entity = member.toEntity();
    const params = [
      entity.id,
      entity.name,
      entity.location,
      entity.education,
      entity.profession,
      entity.member_type,
      entity.expiration_date,
      entity.chapter_id,
      entity.employer,
      entity.year_of_birth,
    ];
    await this.db.any(this.sqlProvider.MemberUpdate, params);
    const updated = await this.db.one<MemberEntity>(
      this.sqlProvider.MemberById,
      member.id
    );
    return Member.fromEntity(updated);
  }

  async findType(id: number): Promise<MemberType | null> {
    const result = await this.db.oneOrNone<{ member_type: string }>(
      this.sqlProvider.MemberTypeById,
      id
    );
    if (result == null) return null;
    return deserialize(result.member_type);
  }
}
