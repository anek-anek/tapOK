import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class ConfirmAmotPaymentDto {
  @ApiProperty({ example: 500, description: 'The exact amount paid by the crew member to verify against the ledger' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
