// ==============================================
// Create Site DTO — Validation for adding a new site
// Like: php artisan make:request CreateSiteRequest
//
// DTO = Data Transfer Object
// Validates the request body before it reaches the controller
// If validation fails → 400 Bad Request with error messages
// ==============================================

import { IsString, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSiteDto {
  // Site URL — must be a valid URL
  // Like: 'url' => 'required|url' in Laravel validation
  @ApiProperty({
    example: 'https://example.com',
    description: 'The website URL to audit',
  })
  @IsUrl({}, { message: 'Please enter a valid URL (e.g., https://example.com)' })
  url: string;

  // Site name — friendly name for the site
  // Like: 'name' => 'required|string|min:2|max:100' in Laravel
  @ApiProperty({
    example: 'My Business Website',
    description: 'A friendly name for this site',
  })
  @IsString()
  @MinLength(2, { message: 'Site name must be at least 2 characters' })
  @MaxLength(100, { message: 'Site name must be less than 100 characters' })
  name: string;

  // Team ID — optional, for shared sites
  // Like: 'team_id' => 'nullable|exists:teams,id' in Laravel
  @ApiPropertyOptional({
    example: 'team-uuid-here',
    description: 'Optional team ID to share this site with a team',
  })
  @IsOptional()
  @IsString()
  teamId?: string;
}
