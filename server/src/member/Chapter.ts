import { ChapterEntity } from "./ChapterEntity";

export class Chapter {
  readonly id: number;
  readonly name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  static fromEntity(entity: ChapterEntity): Chapter {
    return new Chapter(entity.id, entity.name);
  }
}
