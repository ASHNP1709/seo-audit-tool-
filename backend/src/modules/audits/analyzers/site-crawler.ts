// ==============================================
// Site Crawler — Multi-Page Website Crawler
// Like: a web spider that follows links across the site
//
// How it works:
// 1. Start at homepage
// 2. Fetch the HTML
// 3. Extract all internal links
// 4. Add them to a queue
// 5. Fetch next page from queue
// 6. Repeat until maxPages reached
// 7. Return all crawled page data
//
// Like: Spatie Crawler in Laravel (spatie/crawler)
// But simpler — built from scratch
//
// Uses:
// - axios = fetch pages (like Http::get() in Laravel)
// - cheerio = parse HTML (like DOMDocument in PHP)
// - Set = track visited URLs (avoid duplicates)
// ==============================================

import axios from 'axios';
import * as cheerio from 'cheerio';

// Interface for data collected from each crawled page
export interface CrawledPageData {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  canonicalUrl: string | null;
  contentLength: number;
  wordCount: number;
  loadTime: number;
  depth: number;               // How many clicks from homepage (0 = homepage)
  isIndexable: boolean;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  totalImages: number;
  missingAlt: number;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
}

// Interface for issues found on each page
export interface PageIssue {
  category: string;
  severity: string;
  title: string;
  description: string;
  url: string;
  recommendation: string;
}

// Interface for the complete crawl result
export interface CrawlResult {
  pages: CrawledPageData[];
  issues: PageIssue[];
  scores: {
    overall: number;
    technical: number;
    content: number;
    speed: number;
  };
  meta: {
    ssl: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
  };
  stats: {
    totalPages: number;
    crawledPages: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    averageLoadTime: number;
    averageWordCount: number;
  };
}

export class SiteCrawler {
  private baseUrl: string;           // "https://example.com"
  private startUrl: string;          // Full starting URL
  private maxPages: number;          // How many pages to crawl
  private visited: Set<string>;      // Track visited URLs (avoid duplicates)
  private queue: { url: string; depth: number }[];  // Pages waiting to be crawled
  private pages: CrawledPageData[];  // Results from each page
  private issues: PageIssue[];       // All issues found across all pages
  private concurrency: number;       // How many pages to fetch at once

  constructor(url: string, maxPages: number = 10) {
    this.startUrl = url;
    this.maxPages = maxPages;
    this.visited = new Set();
    this.queue = [];
    this.pages = [];
    this.issues = [];
    this.concurrency = 3;  // Fetch 3 pages at a time (be polite to the server)

    // Extract base URL — "https://example.com/page" → "https://example.com"
    // Like: parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST)
    const urlObj = new URL(url);
    this.baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  }

  // ============ MAIN CRAWL METHOD ============
  // Starts the crawling process
  // Like: public function crawl(): CrawlResult
  async crawl(): Promise<CrawlResult> {
    // Add the starting URL to the queue
    this.queue.push({ url: this.startUrl, depth: 0 });

    // Keep crawling until queue is empty OR we've hit maxPages
    // Like: while(!$queue->isEmpty() && $crawledCount < $maxPages)
    while (this.queue.length > 0 && this.pages.length < this.maxPages) {
      // Take a batch of URLs to crawl concurrently
      // Like: $batch = $queue->splice(0, $concurrency)
      const batch = this.queue.splice(0, this.concurrency);
      const remaining = this.maxPages - this.pages.length;
      const toProcess = batch.slice(0, remaining);

      // Crawl all pages in batch simultaneously
      // Like: Promise.all = Http::pool() in Laravel
      await Promise.all(
        toProcess.map((item) => this.crawlPage(item.url, item.depth))
      );
    }

    // Check site-wide technical SEO
    const ssl = this.startUrl.startsWith('https');
    const hasRobotsTxt = await this.checkUrl(this.baseUrl + '/robots.txt');
    const hasSitemap = await this.checkUrl(this.baseUrl + '/sitemap.xml');

    // Add site-wide issues
    this.addSiteWideIssues(ssl, hasRobotsTxt, hasSitemap);

    // Calculate aggregated scores
    const scores = this.calculateScores();

    // Calculate stats
    const stats = this.calculateStats();

    return {
      pages: this.pages,
      issues: this.issues,
      scores,
      meta: { ssl, hasRobotsTxt, hasSitemap },
      stats,
    };
  }

  // ============ CRAWL A SINGLE PAGE ============
  // Fetches one page, analyzes it, extracts links
  // Like: private function crawlSinglePage($url, $depth)
  private async crawlPage(url: string, depth: number): Promise<void> {
    // Normalize URL — remove trailing slash, hash fragments, query params we don't need
    const normalizedUrl = this.normalizeUrl(url);

    // Skip if already visited
    // Like: if(in_array($url, $visited)) continue;
    if (this.visited.has(normalizedUrl)) return;
    if (this.pages.length >= this.maxPages) return;

    // Mark as visited
    this.visited.add(normalizedUrl);

    const startTime = Date.now();
    let html: string;
    let statusCode: number;
    let contentLength: number;

    try {
      // Fetch the page
      // Like: $response = Http::timeout(15)->get($url)
      const response = await axios.get(normalizedUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        maxRedirects: 5,
        validateStatus: () => true,
      });

      // Only analyze HTML pages (skip PDFs, images, etc.)
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html')) return;

      html = typeof response.data === 'string' ? response.data : '';
      statusCode = response.status;
      contentLength = Buffer.byteLength(html, 'utf8');
    } catch {
      // If page can't be reached, add issue and skip
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'HIGH',
        title: 'Page unreachable',
        description: 'Could not fetch page: ' + normalizedUrl,
        url: normalizedUrl,
        recommendation: 'Check if the page URL is correct and the server is responding.',
      });
      return;
    }

    const loadTime = Date.now() - startTime;

    // Parse HTML
    // Like: $dom = new DOMDocument(); $dom->loadHTML($html);
    const $ = cheerio.load(html);

    // ---- Extract page data ----
    const title = $('title').text().trim() || null;
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
    const h1 = $('h1').first().text().trim() || null;
    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const isIndexable = !robotsMeta.includes('noindex');

    // Count words
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').filter((w: any) => w.length > 0).length;

    // Extract headings
    const headings: any = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
    for (let i = 1; i <= 6; i++) {
      $('h' + i).each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) headings['h' + i].push(text);
      });
    }

    // Count images and missing alt
    let missingAlt = 0;
    const totalImages = $('img').length;
    $('img').each((_: any, el: any) => {
      if ($(el).attr('alt') === undefined) missingAlt++;
    });

    // Count internal and external links
    let internalLinks = 0;
    let externalLinks = 0;
    const discoveredUrls: string[] = [];

    $('a[href]').each((_: any, el: any) => {
      const href = $(el).attr('href') || '';

      // Skip non-page links
      if (href.startsWith('#') || href.startsWith('javascript:') ||
          href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Resolve relative URLs to absolute
      // Like: url($href, $baseUrl) in PHP
      let absoluteUrl = '';
      try {
        if (href.startsWith('/')) {
          absoluteUrl = this.baseUrl + href;
        } else if (href.startsWith('http')) {
          absoluteUrl = href;
        } else {
          return; // Skip relative without leading /
        }
      } catch {
        return;
      }

      // Check internal vs external
      if (absoluteUrl.startsWith(this.baseUrl)) {
        internalLinks++;
        // Add to crawl queue if not visited yet
        const normalized = this.normalizeUrl(absoluteUrl);
        if (!this.visited.has(normalized) && this.shouldCrawl(normalized)) {
          discoveredUrls.push(normalized);
        }
      } else {
        externalLinks++;
      }
    });

    // Save page data
    const pageData: CrawledPageData = {
      url: normalizedUrl,
      statusCode,
      title,
      metaDescription,
      h1,
      canonicalUrl: canonical,
      contentLength,
      wordCount,
      loadTime,
      depth,
      isIndexable,
      internalLinks,
      externalLinks,
      brokenLinks: 0,
      totalImages,
      missingAlt,
      headings,
    };

    this.pages.push(pageData);

    // ---- Analyze this page for issues ----
    this.analyzePageIssues(pageData);

    // ---- Add discovered URLs to the queue ----
    // Only add if we haven't hit the page limit
    // Like: $queue->push(['url' => $newUrl, 'depth' => $depth + 1])
    for (const newUrl of discoveredUrls) {
      if (!this.visited.has(newUrl) && this.pages.length + this.queue.length < this.maxPages * 2) {
        this.queue.push({ url: newUrl, depth: depth + 1 });
      }
    }
  }

  // ============ ANALYZE PAGE ISSUES ============
  // Checks each page for SEO problems
  // Like: private function analyzeIssues(CrawledPage $page)
  private analyzePageIssues(page: CrawledPageData): void {
    const pageUrl = page.url;

    // --- Title checks ---
    if (!page.title) {
      this.issues.push({
        category: 'CONTENT', severity: 'CRITICAL',
        title: 'Missing title tag',
        description: 'No <title> tag found on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add a unique, descriptive title tag between 50-60 characters.',
      });
    } else if (page.title.length < 30) {
      this.issues.push({
        category: 'CONTENT', severity: 'MEDIUM',
        title: 'Title tag too short',
        description: 'Title is ' + page.title.length + ' chars on ' + pageUrl + '. Recommended: 50-60.',
        url: pageUrl,
        recommendation: 'Expand your title to 50-60 characters.',
      });
    } else if (page.title.length > 60) {
      this.issues.push({
        category: 'CONTENT', severity: 'MEDIUM',
        title: 'Title tag too long',
        description: 'Title is ' + page.title.length + ' chars on ' + pageUrl + '. Google truncates after ~60.',
        url: pageUrl,
        recommendation: 'Shorten your title to 60 characters or less.',
      });
    }

    // --- Meta description checks ---
    if (!page.metaDescription) {
      this.issues.push({
        category: 'CONTENT', severity: 'HIGH',
        title: 'Missing meta description',
        description: 'No meta description on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add a compelling meta description between 150-160 characters.',
      });
    } else if (page.metaDescription.length < 120) {
      this.issues.push({
        category: 'CONTENT', severity: 'LOW',
        title: 'Meta description too short',
        description: 'Meta description is ' + page.metaDescription.length + ' chars on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Expand meta description to 150-160 characters.',
      });
    } else if (page.metaDescription.length > 160) {
      this.issues.push({
        category: 'CONTENT', severity: 'LOW',
        title: 'Meta description too long',
        description: 'Meta description is ' + page.metaDescription.length + ' chars on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Shorten meta description to 160 characters or less.',
      });
    }

    // --- H1 checks ---
    if (!page.h1) {
      this.issues.push({
        category: 'CONTENT', severity: 'HIGH',
        title: 'Missing H1 tag',
        description: 'No H1 heading on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add a single H1 tag that describes the main topic.',
      });
    }

    if (page.headings.h1.length > 1) {
      this.issues.push({
        category: 'CONTENT', severity: 'MEDIUM',
        title: 'Multiple H1 tags',
        description: 'Found ' + page.headings.h1.length + ' H1 tags on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Use only one H1 per page. Use H2-H6 for subheadings.',
      });
    }

    // --- Image alt text ---
    if (page.missingAlt > 0) {
      this.issues.push({
        category: 'CONTENT',
        severity: page.missingAlt > 5 ? 'HIGH' : 'MEDIUM',
        title: 'Images missing alt text',
        description: page.missingAlt + ' of ' + page.totalImages + ' images missing alt on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add descriptive alt text to all images.',
      });
    }

    // --- Canonical tag ---
    if (!page.canonicalUrl) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'MEDIUM',
        title: 'Missing canonical tag',
        description: 'No canonical URL on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add <link rel="canonical"> to prevent duplicate content.',
      });
    }

    // --- Thin content ---
    if (page.wordCount < 300) {
      this.issues.push({
        category: 'CONTENT',
        severity: page.wordCount < 100 ? 'HIGH' : 'MEDIUM',
        title: 'Thin content',
        description: 'Only ' + page.wordCount + ' words on ' + pageUrl + '. Recommended: 300+.',
        url: pageUrl,
        recommendation: 'Add more valuable content. Aim for 300+ words on standard pages.',
      });
    }

    // --- Internal links ---
    if (page.internalLinks < 3) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'MEDIUM',
        title: 'Few internal links',
        description: 'Only ' + page.internalLinks + ' internal links on ' + pageUrl,
        url: pageUrl,
        recommendation: 'Add more internal links to improve crawlability and SEO.',
      });
    }

    // --- Page speed ---
    if (page.loadTime > 3000) {
      this.issues.push({
        category: 'SPEED', severity: 'HIGH',
        title: 'Slow page load',
        description: pageUrl + ' took ' + (page.loadTime / 1000).toFixed(1) + 's to load.',
        url: pageUrl,
        recommendation: 'Optimize images, enable compression, and minimize CSS/JS.',
      });
    } else if (page.loadTime > 1500) {
      this.issues.push({
        category: 'SPEED', severity: 'MEDIUM',
        title: 'Page could be faster',
        description: pageUrl + ' took ' + (page.loadTime / 1000).toFixed(1) + 's. Target: under 1.5s.',
        url: pageUrl,
        recommendation: 'Consider optimizing images and enabling browser caching.',
      });
    }

    // --- Status code issues ---
    if (page.statusCode >= 400) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: page.statusCode === 404 ? 'HIGH' : 'CRITICAL',
        title: 'HTTP ' + page.statusCode + ' error',
        description: pageUrl + ' returned status code ' + page.statusCode,
        url: pageUrl,
        recommendation: page.statusCode === 404
          ? 'Fix this broken page — either restore it or set up a 301 redirect.'
          : 'Investigate the server error on this page.',
      });
    }

    // --- Noindex check ---
    if (!page.isIndexable) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'INFO',
        title: 'Page set to noindex',
        description: pageUrl + ' has a noindex tag. It will not appear in search results.',
        url: pageUrl,
        recommendation: 'Remove noindex if this page should appear in search results.',
      });
    }

    // --- Page size check ---
    const sizeKB = Math.round(page.contentLength / 1024);
    if (sizeKB > 3000) {
      this.issues.push({
        category: 'SPEED', severity: 'HIGH',
        title: 'Page too large',
        description: pageUrl + ' is ' + sizeKB + 'KB. Recommended: under 3MB.',
        url: pageUrl,
        recommendation: 'Compress images, minify CSS/JS, remove unnecessary code.',
      });
    }
  }

  // ============ SITE-WIDE ISSUES ============
  // Issues that apply to the whole site, not individual pages
  private addSiteWideIssues(ssl: boolean, hasRobotsTxt: boolean, hasSitemap: boolean): void {
    if (!ssl) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'CRITICAL',
        title: 'Not using HTTPS',
        description: 'Site is not using SSL. Google penalizes non-HTTPS sites.',
        url: this.baseUrl,
        recommendation: 'Install an SSL certificate and redirect HTTP to HTTPS.',
      });
    }

    if (!hasRobotsTxt) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'MEDIUM',
        title: 'Missing robots.txt',
        description: 'No robots.txt found at ' + this.baseUrl + '/robots.txt',
        url: this.baseUrl + '/robots.txt',
        recommendation: 'Create a robots.txt to guide search engine crawlers.',
      });
    }

    if (!hasSitemap) {
      this.issues.push({
        category: 'TECHNICAL', severity: 'MEDIUM',
        title: 'Missing XML sitemap',
        description: 'No sitemap.xml found at ' + this.baseUrl + '/sitemap.xml',
        url: this.baseUrl + '/sitemap.xml',
        recommendation: 'Create an XML sitemap and submit to Google Search Console.',
      });
    }

    // Check for duplicate titles across pages
    const titles = this.pages.filter((p) => p.title).map((p) => p.title);
    const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
    if (duplicateTitles.length > 0) {
      this.issues.push({
        category: 'CONTENT', severity: 'HIGH',
        title: 'Duplicate title tags found',
        description: duplicateTitles.length + ' pages share the same title tag.',
        url: this.baseUrl,
        recommendation: 'Every page should have a unique title tag describing its specific content.',
      });
    }

    // Check for duplicate meta descriptions
    const metas = this.pages.filter((p) => p.metaDescription).map((p) => p.metaDescription);
    const duplicateMetas = metas.filter((m, i) => metas.indexOf(m) !== i);
    if (duplicateMetas.length > 0) {
      this.issues.push({
        category: 'CONTENT', severity: 'MEDIUM',
        title: 'Duplicate meta descriptions found',
        description: duplicateMetas.length + ' pages share the same meta description.',
        url: this.baseUrl,
        recommendation: 'Write unique meta descriptions for every page.',
      });
    }
  }

  // ============ CALCULATE SCORES ============
  // Aggregates scores across all pages
  private calculateScores() {
    let technical = 100;
    let content = 100;
    let speed = 100;

    // Deduct points based on issues
    for (const issue of this.issues) {
      const deduction =
        issue.severity === 'CRITICAL' ? 15 :
        issue.severity === 'HIGH' ? 8 :
        issue.severity === 'MEDIUM' ? 4 :
        issue.severity === 'LOW' ? 2 : 0;

      if (issue.category === 'TECHNICAL' || issue.category === 'UX') {
        technical = Math.max(0, technical - deduction);
      } else if (issue.category === 'CONTENT') {
        content = Math.max(0, content - deduction);
      } else if (issue.category === 'SPEED') {
        speed = Math.max(0, speed - deduction);
      }
    }

    const overall = Math.round(technical * 0.35 + content * 0.35 + speed * 0.3);
    return { overall, technical, content, speed };
  }

  // ============ CALCULATE STATS ============
  private calculateStats() {
    const criticalIssues = this.issues.filter((i) => i.severity === 'CRITICAL').length;
    const highIssues = this.issues.filter((i) => i.severity === 'HIGH').length;
    const avgLoadTime = this.pages.length > 0
      ? Math.round(this.pages.reduce((sum, p) => sum + p.loadTime, 0) / this.pages.length)
      : 0;
    const avgWordCount = this.pages.length > 0
      ? Math.round(this.pages.reduce((sum, p) => sum + p.wordCount, 0) / this.pages.length)
      : 0;

    return {
      totalPages: this.pages.length,
      crawledPages: this.pages.length,
      totalIssues: this.issues.length,
      criticalIssues,
      highIssues,
      averageLoadTime: avgLoadTime,
      averageWordCount: avgWordCount,
    };
  }

  // ============ HELPER METHODS ============

  // Normalize URL — remove hash, trailing slash, sort query params
  // Like: rtrim($url, '/') in PHP
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove hash fragment
      urlObj.hash = '';
      // Remove trailing slash (except for root)
      let normalized = urlObj.toString();
      if (normalized.endsWith('/') && urlObj.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      return url;
    }
  }

  // Should we crawl this URL?
  // Skip images, PDFs, stylesheets, etc.
  private shouldCrawl(url: string): boolean {
    const skipExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
      '.css', '.js', '.xml', '.json', '.zip', '.mp4', '.mp3',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.ico', '.woff',
      '.woff2', '.ttf', '.eot',
    ];

    const lower = url.toLowerCase();
    for (const ext of skipExtensions) {
      if (lower.includes(ext)) return false;
    }

    // Only crawl same domain
    return url.startsWith(this.baseUrl);
  }

  // Check if a URL exists (for robots.txt, sitemap.xml)
  private async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: () => true,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
