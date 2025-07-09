import { IsNotEmpty, IsString } from 'class-validator';

export class PathDto {
  @IsNotEmpty()
  @IsString()
  path: string;
}
