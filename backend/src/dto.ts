import { Transform } from 'class-transformer';
import { Allow, IsByteLength, IsEmail, IsEnum, IsIn, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { AccountStatus, Availability, BookingActivity, BookingStatus, Condition, Role, ScheduleStatus } from './entities';

const trim = Transform(({ value }) => typeof value === 'string' ? value.trim() : value);
const email = Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value);

export class Login {
  @email @Allow()
  email!: unknown;

  @Allow()
  password!: unknown;
}

class UserCredentials {
  @email @IsEmail() @Length(3, 100)
  email!: string;

  @IsString() @Length(8, 72) @IsByteLength(8, 72)
  password!: string;
}

export class UserInput extends UserCredentials {
  @trim @IsString() @Length(1, 50)
  firstName!: string;

  @trim @IsString() @Length(1, 50)
  lastName!: string;

  @IsEnum(Role)
  role!: Role;

  @IsEnum(AccountStatus)
  accountStatus!: AccountStatus;
}

export class RegistrationInput extends UserCredentials {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value)
  @IsString() @Length(1, 101)
  fullName!: string;

  @IsString() @Length(8, 72) @IsByteLength(8, 72)
  confirmPassword!: string;
}

export class UserUpdate extends UserInput {
  @ValidateIf((_object, value) => value !== undefined)
  declare password: string;
}

export class ScheduleInput {
  @trim @IsString() @Length(1, 100)
  activityName!: string;

  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/) @IsISO8601({ strict: true })
  scheduleDate!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  endTime!: string;

  @IsEnum(ScheduleStatus)
  status!: ScheduleStatus;
}

export class EquipmentInput {
  @trim @IsString() @Length(1, 100)
  equipmentName!: string;

  @trim @IsString() @Length(1, 50)
  category!: string;

  @IsEnum(Condition)
  equipmentCondition!: Condition;

  @IsOptional() @IsEnum(Availability)
  availabilityStatus?: Availability;
}

export class InventoryInput {
  @IsInt() @Min(0) @Max(2147483647)
  quantity!: number;
}

export class BookingInput {
  @IsEnum(BookingActivity)
  activity!: BookingActivity;

  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/) @IsISO8601({ strict: true })
  bookingDate!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  endTime!: string;

  @IsOptional() @trim @IsString() @MaxLength(500)
  notes?: string;
}

export class BookingDecision {
  @IsIn([BookingStatus.APPROVED, BookingStatus.REJECTED])
  status!: BookingStatus.APPROVED | BookingStatus.REJECTED;

  @IsOptional() @trim @IsString() @MaxLength(500)
  reason?: string;
}
