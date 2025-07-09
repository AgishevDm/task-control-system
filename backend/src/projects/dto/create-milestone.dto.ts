import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  dateEnd: string;

  @IsString()
  @IsIn(['Planned', 'Achieved', 'Missed'])
  status: 'Planned' | 'Achieved' | 'Missed';
}
