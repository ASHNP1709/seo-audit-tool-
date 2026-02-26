// ==============================================
// Audits Controller — API endpoints for running audits
// Like: php artisan make:controller AuditController
//
// Routes:
// POST   /api/audits           → runAudit()     — Start a new audit
// GET    /api/audits/site/:id  → findAllBySite() — List audits for a site
// GET    /api/audits/:id       → findOne()       — Get full audit report
//
// All routes protected with JWT
// Like: Route::middleware('auth:api')->group(...)
// ==============================================

import {
  Controller,
  Get,
  Post,
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
import { AuditsService } from './audits.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@ApiTags('Audits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  // POST /api/audits — Run a new audit
  // This is the main action — crawls the site and returns results
  // Like: public function store(RunAuditRequest $request)
  @Post()
  @ApiOperation({ summary: 'Run a new SEO audit on a website' })
  @ApiResponse({ status: 201, description: 'Audit completed with results' })
  @ApiResponse({ status: 400, description: 'Audit failed' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  runAudit(@Request() req: any, @Body() createAuditDto: CreateAuditDto) {
    return this.auditsService.runAudit(req.user.id, createAuditDto);
  }

  // GET /api/audits/site/:siteId — List all audits for a site
  // Like: public function index($siteId) { return $site->audits; }
  @Get('site/:siteId')
  @ApiOperation({ summary: 'List all audits for a website' })
  @ApiResponse({ status: 200, description: 'List of audits' })
  findAllBySite(@Request() req: any, @Param('siteId') siteId: string) {
    return this.auditsService.findAllBySite(req.user.id, siteId);
  }

  // GET /api/audits/:id — Get full audit report
  // Returns scores + all issues + crawled page data
  // Like: public function show($id) { return Audit::with('issues')->findOrFail($id); }
  @Get(':id')
  @ApiOperation({ summary: 'Get full audit report with all details' })
  @ApiResponse({ status: 200, description: 'Full audit report' })
  @ApiResponse({ status: 404, description: 'Audit not found' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.auditsService.findOne(req.user.id, id);
  }
}
