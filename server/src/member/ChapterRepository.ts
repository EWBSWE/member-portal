import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { ChapterEntity } from "./ChapterEntity";
import { Chapter } from "./Chapter";

export class ChapterRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;
  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async all(): Promise<Chapter[]> {
    const result = await this.db.many<ChapterEntity>(this.sqlProvider.Chapters);
    return result.map(Chapter.fromEntity);
  }

  async findBy(id: number): Promise<Chapter | null> {
    const result = await this.db.oneOrNone<ChapterEntity>(
      this.sqlProvider.ChapterById,
      id
    );
    if (result == null) return null;
    return Chapter.fromEntity(result);
  }
}
