import { IsString, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { FeedbackType } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEnum(FeedbackType)
  type: FeedbackType;
}

export class VoteFeedbackDto {
  @IsEnum([-1, 1])
  value: number;
}
