import { Result, empty, ok } from "../Result";
import { ProductRepository } from "./ProductRepository";
import { MemberRepository } from "../member/MemberRepository";
import { MembershipProduct } from "./Product";
import { MemberTypeEntity } from "../member/MemberTypeEntity";

export class ProductController {
  private readonly productRepository: ProductRepository;
  private readonly memberRepository: MemberRepository;

  constructor(
    productRepository: ProductRepository,
    memberRepository: MemberRepository
  ) {
    this.productRepository = productRepository;
    this.memberRepository = memberRepository;
  }

  async memberships(): Promise<Result<MembershipsResponse>> {
    const memberships = await this.productRepository.memberships();
    const memberTypes = await this.memberRepository.types();
    return ok(createMembershipResponse(memberships, memberTypes));
  }
}

function createMembershipResponse(
  memberships: MembershipProduct[],
  memberTypes: MemberTypeEntity[]
): MembershipsResponse {
  return memberships.map((membership) => {
    const memberType = memberTypes.find(
      (memberType) => memberType.id === membership.memberTypeId()
    );
    return {
      id: membership.id,
      name: membership.name,
      price: membership.price,
      description: membership.description,
      attribute: {
        days: membership.durationDays(),
        member_type: memberType!.member_type,
        member_type_id: memberType!.id,
      },
      product_type_id: membership.productTypeId,
      currency_code: membership.currencyCode,
    };
  });
}

type MembershipsResponse = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  attribute: {
    days: number;
    member_type_id: number;
    member_type: string;
  };
  product_type_id: number;
  currency_code: string;
}[];
