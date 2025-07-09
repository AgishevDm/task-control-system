import { IsNotEmpty, IsString } from 'class-validator';

export class MoveItemDto {
  @IsNotEmpty()
  @IsString()
  newParentId: string;
}
