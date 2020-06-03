import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { ProductEntity } from "./ProductEntity";
import { MembershipProduct, Product } from "./Product";

export class ProductRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;
  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async findMembership(id: number): Promise<MembershipProduct | null> {
    const entity = await this.db.oneOrNone<ProductEntity>(
      this.sqlProvider.MembershipProductById,
      id
    );
    if (entity == null) return null;
    return MembershipProduct.fromEntity(entity);
  }

  async memberships(): Promise<MembershipProduct[]> {
    const result = await this.db.many<ProductEntity>(
      this.sqlProvider.MembershipProducts
    );
    return result.map(MembershipProduct.fromEntity);
  }
}
