import { ProductEntity } from "./ProductEntity";

export class Product {
  readonly id: number;
  readonly productTypeId: number;
  readonly name: string;
  readonly price: number;
  readonly description: string | null;
  protected readonly attribute: any | null;
  readonly currencyCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: number,
    productTypeId: number,
    name: string,
    price: number,
    description: string | null,
    attribute: any | null,
    currencyCode: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.productTypeId = productTypeId;
    this.name = name;
    this.price = price;
    this.description = description;
    this.attribute = attribute;
    this.currencyCode = currencyCode;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class MembershipProduct extends Product {
  durationDays(): number {
    return this.attribute.days;
  }

  memberTypeId(): number {
    return this.attribute.member_type_id;
  }

  static fromEntity(entity: ProductEntity): MembershipProduct {
    return new MembershipProduct(
      entity.id,
      entity.product_type_id,
      entity.name,
      entity.price,
      entity.description,
      entity.attribute,
      entity.currency_code,
      entity.created_at,
      entity.updated_at
    );
  }
}
