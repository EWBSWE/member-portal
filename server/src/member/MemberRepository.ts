import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { MemberEntity } from "./MemberEntity";
import { Member } from "./Member";

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
}
