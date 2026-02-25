// ============================================
// LoginDto — Validates login data
// Like: php artisan make:request LoginRequest
//
// In Laravel:
//   public function rules() {
//     return [
//       'email' => 'required|email',
//       'password' => 'required|string|min:8',
//     ];
//   }
//
// In NestJS: Same validation, different syntax (decorators)
// ============================================

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// ApiProperty makes these fields show up in Swagger docs
// with pre-filled example values so client can click "Try it out"

export class LoginDto {

  // ---- EMAIL FIELD ----
  // Swagger will show "admin@completeseoaudit.com" as example
  // Client can click "Try it out" and it's already filled in
  @ApiProperty({
    example: 'admin@completeseoaudit.com',
    description: 'Registered email address',
  })
  // In Laravel: 'email' => 'required|email'
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  // ---- PASSWORD FIELD ----
  @ApiProperty({
    example: 'Admin@123456',
    description: 'Account password',
  })
  // In Laravel: 'password' => 'required|string|min:8'
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}