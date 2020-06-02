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

  async add(unsaved: UnsavedMember): Promise<Member> {
    const params = [
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
    const saved = await this.db.one<MemberEntity>(
      this.sqlProvider.MemberInsert,
      params
    );
    return Member.fromEntity(saved);
  }
}
