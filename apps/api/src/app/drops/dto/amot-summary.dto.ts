import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class AmotParticipantDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  avatar?: string | null;

  @ApiProperty()
  isOptedOut: boolean;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  isCarrier: boolean;
}

export class AmotSummaryDto {
  @ApiProperty({ type: Number, nullable: true })
  amotCost: number | null;

  @ApiPropertyOptional({ nullable: true })
  amotDeclaredById?: string | null;

  @ApiProperty({ type: Number })
  perPersonShare: number;

  @ApiProperty({ type: Number })
  participantCount: number;

  @ApiProperty({ enum: ['carrier', 'opted_in', 'opted_out', 'not_applicable'] })
  myStatus: 'carrier' | 'opted_in' | 'opted_out' | 'not_applicable';

  @ApiProperty({ type: Number })
  myOwed: number;

  @ApiProperty({ type: Number })
  carrierOwed: number;

  @ApiProperty({ type: [AmotParticipantDto] })
  participants: AmotParticipantDto[];
}

export class DeclareAmotDto {
  @ApiProperty({ type: Number, example: 500 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(999999)
  cost: number;
}

export class ToggleAmotOptOutDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  isOptedOut: boolean;
}

export class ToggleAmotPaidDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  @IsNotEmpty()
  isPaid: boolean;
}

export class SubmitAmotProofDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  proofBase64: string;
}
