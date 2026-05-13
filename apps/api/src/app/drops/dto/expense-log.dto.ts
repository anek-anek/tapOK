import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { ExpenseLogStatus } from '../entities/drop-expense-log.entity';

export class CreateExpenseLogDto {
  @ApiProperty({ description: 'Short description of the expense' })
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ description: 'Amount spent', type: Number })
  @IsNumber()
  @IsPositive()
  @Max(999999.99)
  amount: number;
}

export class ExpenseLogPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dropId: string;

  @ApiProperty()
  submittedById: string;

  @ApiPropertyOptional()
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };

  @ApiProperty()
  description: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ enum: ExpenseLogStatus })
  status: ExpenseLogStatus;

  @ApiPropertyOptional()
  reviewedById?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'ID of the DropItem created when this log was approved' })
  linkedItemId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
