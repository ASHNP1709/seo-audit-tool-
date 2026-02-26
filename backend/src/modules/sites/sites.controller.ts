// ==============================================
// Sites Controller — API endpoints for site management
// Like: php artisan make:controller SiteController --resource
//
// Routes:
// POST   /api/sites      → create()
// GET    /api/sites      → findAll()
// GET    /api/sites/:id  → findOne()
// PATCH  /api/sites/:id  → update()
// DELETE /api/sites/:id  → remove()
//
// All routes protected with JWT
// Like: Route::middleware('auth:api')->resource('sites', SiteController)
// ==============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@ApiTags('Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new website' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Request() req: any, @Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(req.user.id, createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all your websites' })
  @ApiResponse({ status: 200, description: 'List of sites' })
  findAll(@Request() req: any) {
    return this.sitesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single website by ID' })
  @ApiResponse({ status: 200, description: 'Site details' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.sitesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update website details' })
  @ApiResponse({ status: 200, description: 'Site updated' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(req.user.id, id, updateSiteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a website' })
  @ApiResponse({ status: 200, description: 'Site deleted' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.sitesService.remove(req.user.id, id);
  }
}
