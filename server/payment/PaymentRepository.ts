import { Payment } from "./Payment";
import { IDatabase } from "pg-promise";
import { SqlProvider } from "../SqlProvider";
import { PaymentEntity } from "./PaymentEntity";

export class PaymentRepository {
  private readonly db: IDatabase<{}, any>;
  private readonly sqlProvider: SqlProvider;

  constructor(db: IDatabase<{}, any>, sqlProvider: SqlProvider) {
    this.db = db;
    this.sqlProvider = sqlProvider;
  }

  async find(id: number): Promise<Payment | null> {
    const result = await this.db.oneOrNone<PaymentEntity>(
      this.sqlProvider.PaymentById,
      id
    );
    if (result == null) return null;
    return Payment.fromEntity(result);
  }
}
