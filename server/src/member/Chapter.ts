import { MemberType, deserialize } from "./MemberType";
import { ChapterEntity } from "./ChapterEntity";

export class Chapter {
  readonly id: number;
  readonly memberType: MemberType;
  readonly name: string;
  readonly memberTypeId: number;

  constructor(
    id: number,
    memberType: MemberType,
    name: string,
    memberTypeId: number
  ) {
    this.id = id;
    this.memberType = memberType;
    this.name = name;
    this.memberTypeId = memberTypeId;
  }

  static fromEntity(entity: ChapterEntity): Chapter {
    return new Chapter(
      entity.id,
      deserialize(entity.member_type),
      entity.name,
      entity.member_type_id
    );
  }
}
