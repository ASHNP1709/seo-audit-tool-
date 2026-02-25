// ============================================
// RegisterDto — Validates registration data
// Like: php artisan make:request RegisterRequest
//
// In Laravel you write:
//   public function rules() {
//     return ['email' => 'required|email', 'password' => 'required|min:8'];
//   }
//
// In NestJS we use decorators on a class:
//   @IsEmail() on the email field
//   @MinLength(8) on the password field
//
// Both do the SAME thing — validate incoming data
// If validation fails → 400 Bad Request with error messages
// ============================================

import {
  IsEmail,        // Like: 'email' rule in Laravel
  IsString,       // Like: 'string' rule
  MinLength,      // Like: 'min:8' rule
  MaxLength,      // Like: 'max:100' rule
  IsOptional,     // Like: 'nullable' rule
  Matches,        // Like: 'regex:/pattern/' rule
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// ApiProperty = tells Swagger docs "show this field with this example"
// Like: writing @bodyParam in Laravel Scribe doc comments
// This makes Swagger show example values so client can test APIs easily
// ApiPropertyOptional = same but marks field as optional in docs

export class RegisterDto {

  // ---- EMAIL FIELD ----
  // ApiProperty: Shows this field in Swagger with example value
  // When client opens /api/docs, they see "admin@completeseoaudit.com" pre-filled
  @ApiProperty({
    example: 'admin@completeseoaudit.com',
    description: 'User email address',
  })
  // Validation: must be valid email format
  // In Laravel: 'email' => 'required|email'
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  // ---- PASSWORD FIELD ----
  @ApiProperty({
    example: 'Admin@123456',
    description: 'Password: min 8 chars, must have uppercase, lowercase, number, special char',
  })
  // Multiple validations stacked (runs ALL of them)
  // In Laravel: 'password' => 'required|string|min:8|max:100|regex:/pattern/'
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  @Matches(
    // Regex: at least 1 lowercase, 1 uppercase, 1 number, 1 special char
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    { message: 'Password must contain uppercase, lowercase, number, and special character' },
  )
  password: string;

  // ---- FIRST NAME FIELD ----
  @ApiProperty({
    example: 'Ashish',
    description: 'First name (min 2 chars)',
  })
  // In Laravel: 'first_name' => 'required|string|min:2|max:50'
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  firstName: string;

  // ---- LAST NAME FIELD (Optional) ----
  // ApiPropertyOptional = shows as optional in Swagger (not required)
  @ApiPropertyOptional({
    example: 'Kumar',
    description: 'Last name (optional)',
  })
  // In Laravel: 'last_name' => 'nullable|string|max:50'
  // The ? after string means this field is optional (TypeScript nullable)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;
}