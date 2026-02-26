// ==============================================
// Audits Service — Orchestrates the audit process
// Like: App\Services\AuditService in Laravel
//
// Flow:
// 1. User clicks "Run Audit" → creates audit record (QUEUED)
// 2. Fetches site URL from database
// 3. Runs SiteCrawler — crawls multiple pages
// 4. Saves results (crawled_pages + audit_issues)
// 5. Updates audit with scores → status = COMPLETED
// ==============================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { SiteCrawler } from './analyzers/site-crawler';

@Injectable()
export class AuditsService {
  constructor(private prisma: PrismaService) {}

  // ============ RUN AUDIT ============
  // Creates audit, runs multi-page crawler, saves results
  // Like: public function runAudit(CreateAuditRequest $request)
  async runAudit(userId: string, createAuditDto: CreateAuditDto) {
    // Step 1: Verify site exists and belongs to user
    const site = await this.prisma.site.findUnique({
      where: { id: createAuditDto.siteId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (site.userId !== userId) {
      throw new ForbiddenException('You do not have access to this site');
    }

    // Step 2: Determine max pages based on request (default: 10)
    const maxPages = createAuditDto.maxPages || 10;

    // Determine audit depth label based on maxPages
    // Like: match($maxPages) { 1-25 => 'SHALLOW', 26-100 => 'MEDIUM', ... }
    const depth = maxPages <= 25 ? 'SHALLOW' : maxPages <= 100 ? 'MEDIUM' : maxPages <= 500 ? 'DEEP' : 'FULL';

    // Step 3: Create audit record with status QUEUED
    const audit = await this.prisma.audit.create({
      data: {
        siteId: site.id,
        userId: userId,
        status: 'QUEUED',
        depth: depth,
        startedAt: new Date(),
        config: { maxPages },  // Store config for reference
      },
    });

    try {
      // Step 4: Update status to CRAWLING
      await this.prisma.audit.update({
        where: { id: audit.id },
        data: { status: 'CRAWLING' },
      });

      // Step 5: Run the multi-page crawler
      // This crawls up to maxPages pages on the site
      // Like: $crawler = new SiteCrawler($site->url, $maxPages); $result = $crawler->crawl();
      const crawler = new SiteCrawler(site.url, maxPages);
      const result = await crawler.crawl();

      // Step 6: Update status to ANALYZING
      await this.prisma.audit.update({
        where: { id: audit.id },
        data: { status: 'ANALYZING' },
      });

      // Step 7: Save ALL crawled pages to database
      // Like: foreach($result->pages as $page) { CrawledPage::create($page); }
      for (const page of result.pages) {
        await this.prisma.crawledPage.create({
          data: {
            auditId: audit.id,
            url: page.url,
            statusCode: page.statusCode,
            title: page.title,
            metaDescription: page.metaDescription,
            h1: page.h1,
            canonicalUrl: page.canonicalUrl,
            contentLength: page.contentLength,
            wordCount: page.wordCount,
            loadTime: page.loadTime,
            depth: page.depth,
            isIndexable: page.isIndexable,
            internalLinks: page.internalLinks,
            externalLinks: page.externalLinks,
            brokenLinks: page.brokenLinks,
            totalImages: page.totalImages,
            missingAlt: page.missingAlt,
            headings: page.headings,
          },
        });
      }

      // Step 8: Save all issues found across all pages
      // Like: AuditIssue::insert($issues)
      if (result.issues.length > 0) {
        await this.prisma.auditIssue.createMany({
          data: result.issues.map((issue) => ({
            auditId: audit.id,
            category: issue.category as any,
            severity: issue.severity as any,
            title: issue.title,
            description: issue.description,
            url: issue.url,
            recommendation: issue.recommendation,
          })),
        });
      }

      // Step 9: Update audit with final scores and COMPLETED status
      const completedAudit = await this.prisma.audit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          overallScore: result.scores.overall,
          technicalScore: result.scores.technical,
          contentScore: result.scores.content,
          speedScore: result.scores.speed,
          totalPages: result.stats.totalPages,
          crawledPages: result.stats.crawledPages,
          totalIssues: result.stats.totalIssues,
          criticalIssues: result.stats.criticalIssues,
          highIssues: result.stats.highIssues,
          completedAt: new Date(),
          duration: Math.round((Date.now() - audit.startedAt!.getTime()) / 1000),
        },
        include: {
          site: true,
          issues: {
            orderBy: [{ severity: 'asc' }, { category: 'asc' }],
          },
          crawledPageData: true,
        },
      });

      return completedAudit;
    } catch (error: any) {
      // If anything fails, mark audit as FAILED
      await this.prisma.audit.update({
        where: { id: audit.id },
        data: { status: 'FAILED', completedAt: new Date() },
      });

      throw new BadRequestException('Audit failed: ' + error.message);
    }
  }

  // ============ GET ALL AUDITS FOR A SITE ============
  // Like: Audit::where('site_id', $siteId)->latest()->get()
  async findAllBySite(userId: string, siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.userId !== userId) {
      throw new ForbiddenException('You do not have access to this site');
    }

    return this.prisma.audit.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { issues: true, crawledPageData: true } },
      },
    });
  }

  // ============ GET SINGLE AUDIT WITH FULL DETAILS ============
  // Like: Audit::with(['issues', 'crawledPages'])->findOrFail($id)
  async findOne(userId: string, auditId: string) {
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        site: true,
        issues: {
          orderBy: [{ severity: 'asc' }, { category: 'asc' }],
        },
        crawledPageData: {
          orderBy: { depth: 'asc' },
        },
      },
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    if (audit.userId !== userId) {
      throw new ForbiddenException('You do not have access to this audit');
    }

    return audit;
  }
}
