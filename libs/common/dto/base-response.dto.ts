import { ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer';

export abstract class BaseResponseDto {
  static of<T extends object>(this: ClassConstructor<T>, partial?: Partial<T>): T {
    return Object.assign(new this() as object, partial ?? {}) as T;
  }

  static fromEntity<T, E>(this: new () => T, entity: E): T {
    return plainToInstance(this, instanceToPlain(entity));
  }

  static fromEntities<T, E>(this: new () => T, entities: E[]): T[] {
    return plainToInstance(this, instanceToPlain(entities) as E[]);
  }
}
