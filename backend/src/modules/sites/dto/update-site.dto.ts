// ==============================================
// Update Site DTO — Validation for updating site details
// Like: php artisan make:request UpdateSiteRequest
//
// PartialType = makes all fields optional
// Like: sometimes|url instead of required|url in Laravel
// User can update just the name, just the URL, or both
// ==============================================

import { PartialType } from '@nestjs/swagger';
import { CreateSiteDto } from './create-site.dto';

// PartialType takes CreateSiteDto and makes ALL fields optional
// So you can send { name: "New Name" } without url
// Like: $request->only(['name', 'url']) in Laravel
export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
