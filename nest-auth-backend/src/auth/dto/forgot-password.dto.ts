import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @IsNotEmpty()
  confirmNewPassword: string;
}
