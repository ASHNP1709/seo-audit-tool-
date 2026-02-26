// ==============================================
// Create Audit DTO — Validation for running an audit
// Like: php artisan make:request RunAuditRequest
//
// User sends:
// { siteId: "uuid", maxPages: 25 }
// maxPages = how many pages to crawl (based on plan)
// ==============================================

import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
  // Which site to audit
  // Like: 'site_id' => 'required|exists:sites,id' in Laravel
  @ApiProperty({
    example: '3136b3da-02b6-4394-a15a-4203f6eb7e08',
    description: 'The site ID to run audit on',
  })
  @IsString()
  siteId: string;

  // How many pages to crawl — user selects based on their plan
  // FREE = 5 pages, STARTER = 25, PRO = 100, AGENCY = 500
  // Like: 'max_pages' => 'nullable|integer|min:1|max:500'
  @ApiPropertyOptional({
    example: 25,
    description: 'Maximum pages to crawl (default: 10, max: 500)',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxPages?: number;
}
