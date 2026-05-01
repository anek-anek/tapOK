import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Self-service profile updates only. Omit identity binding and RBAC columns so
 * PATCH cannot change email, firebaseUid, or role (sync/Firebase claims follow DB role).
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'firebaseUid', 'role'] as const),
) {}
