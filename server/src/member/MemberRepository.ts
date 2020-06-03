import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { MemberEntity } from "./MemberEntity";
import { Member, UnsavedMember } from "./Member";

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
}
