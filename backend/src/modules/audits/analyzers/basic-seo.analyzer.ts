// ==============================================
// Basic SEO Analyzer — The Core Audit Engine
// Like: an SEO analysis service class in Laravel
//
// This is the BRAIN of the SEO Audit Tool!
// It fetches a website, parses the HTML, and checks for SEO issues.
//
// What it checks:
// 1. Title tag (exists? length ok?)
// 2. Meta description (exists? length ok?)
// 3. H1 tag (exists? only one?)
// 4. All headings (H1-H6 structure)
// 5. Images (alt tags missing?)
// 6. Links (internal, external, broken count)
// 7. SSL (HTTPS?)
// 8. Page speed (response time, page size)
// 9. Robots.txt (exists?)
// 10. Sitemap.xml (exists?)
// 11. Canonical tag
// 12. Open Graph / Social tags
// 13. Viewport (mobile-friendly?)
//
// Uses:
// - axios = fetch the HTML (like Http::get() in Laravel)
// - cheerio = parse HTML like jQuery (like DOMDocument in PHP)
// ==============================================

import axios from 'axios';
import * as cheerio from 'cheerio';

// Interface for the complete audit result
// Like: a PHP class that holds all the analysis data
export interface AuditResult {
  // Page data — what we found on the page
  pageData: {
    url: string;
    statusCode: number;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    canonicalUrl: string | null;
    contentLength: number;
    wordCount: number;
    loadTime: number;
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
  };

  // Issues found — array of SEO problems
  // Each issue has category, severity, title, description, recommendation
  issues: {
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }[];

  // Scores — 0 to 100 for each module
  scores: {
    overall: number;
    technical: number;
    content: number;
    speed: number;
  };

  // Meta info about the audit
  meta: {
    ssl: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    hasViewport: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    hasFavicon: boolean;
    language: string | null;
    charset: string | null;
  };
}

export class BasicSeoAnalyzer {
  private url: string;
  private baseUrl: string;
  private issues: AuditResult['issues'] = [];

  constructor(url: string) {
    this.url = url;
    // Extract base URL — "https://example.com/page" → "https://example.com"
    // Like: parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST)
    const urlObj = new URL(url);
    this.baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  }

  // ============ MAIN ANALYZE METHOD ============
  // This is called to run the full audit
  // Like: public function analyze(): AuditResult
  async analyze(): Promise<AuditResult> {
    // Step 1: Fetch the page HTML
    // Like: $response = Http::timeout(30)->get($url)
    const startTime = Date.now();
    let html: string;
    let statusCode: number;
    let contentLength: number;

    try {
      const response = await axios.get(this.url, {
        timeout: 30000, // 30 second timeout
        headers: {
          // Pretend to be a real browser (some sites block bots)
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)',
        },
        // Follow redirects (301, 302)
        maxRedirects: 5,
        // Don't throw on 4xx/5xx status codes
        validateStatus: () => true,
      });

      html = response.data;
      statusCode = response.status;
      contentLength = typeof html === 'string' ? Buffer.byteLength(html, 'utf8') : 0;
    } catch (error: any) {
      // If we can't even reach the site
      return this.createFailedResult(error.message);
    }

    const loadTime = Date.now() - startTime;

    // Step 2: Parse HTML with Cheerio
    // Like: $dom = new DOMDocument(); $dom->loadHTML($html);
    // Cheerio works just like jQuery — $('title').text()
    const $ = cheerio.load(html);

    // Step 3: Extract all data
    const title = this.analyzeTitle($);
    const metaDescription = this.analyzeMetaDescription($);
    const h1 = this.analyzeH1($);
    const headings = this.analyzeHeadings($);
    const imageAnalysis = this.analyzeImages($);
    const linkAnalysis = this.analyzeLinks($);
    const canonical = this.analyzeCanonical($);
    const wordCount = this.getWordCount($);
    const isIndexable = this.checkIndexability($);

    // Step 4: Check technical SEO
    const ssl = this.url.startsWith('https');
    const hasViewport = this.checkViewport($);
    const hasOpenGraph = this.checkOpenGraph($);
    const hasTwitterCard = this.checkTwitterCard($);
    const hasFavicon = this.checkFavicon($);
    const language = $('html').attr('lang') || null;
    const charset = $('meta[charset]').attr('charset') || null;

    // Step 5: Check external resources (robots.txt, sitemap)
    const hasRobotsTxt = await this.checkRobotsTxt();
    const hasSitemap = await this.checkSitemap();

    // Step 6: Analyze page speed basics
    this.analyzeSpeed(loadTime, contentLength);

    // Step 7: Check SSL
    this.analyzeSSL();

    // Step 8: Check robots.txt and sitemap
    if (!hasRobotsTxt) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'MEDIUM',
        title: 'Missing robots.txt',
        description: 'No robots.txt file found at ' + this.baseUrl + '/robots.txt',
        recommendation: 'Create a robots.txt file to guide search engine crawlers on which pages to crawl and which to skip.',
      });
    }

    if (!hasSitemap) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'MEDIUM',
        title: 'Missing XML sitemap',
        description: 'No sitemap.xml found at ' + this.baseUrl + '/sitemap.xml',
        recommendation: 'Create an XML sitemap and submit it to Google Search Console to help search engines discover all your pages.',
      });
    }

    // Step 9: Check viewport (mobile-friendly)
    if (!hasViewport) {
      this.issues.push({
        category: 'UX',
        severity: 'HIGH',
        title: 'Missing viewport meta tag',
        description: 'No viewport meta tag found. Page may not be mobile-friendly.',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your HTML head.',
      });
    }

    // Step 10: Check Open Graph tags
    if (!hasOpenGraph) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'LOW',
        title: 'Missing Open Graph tags',
        description: 'No Open Graph (og:) meta tags found. Social media sharing will use defaults.',
        recommendation: 'Add og:title, og:description, og:image, and og:url tags for better social media sharing.',
      });
    }

    // Step 11: Calculate scores
    const scores = this.calculateScores();

    // Return complete audit result
    return {
      pageData: {
        url: this.url,
        statusCode,
        title,
        metaDescription,
        h1,
        canonicalUrl: canonical,
        contentLength,
        wordCount,
        loadTime,
        isIndexable,
        internalLinks: linkAnalysis.internal,
        externalLinks: linkAnalysis.external,
        brokenLinks: 0, // Would need async checking — future feature
        totalImages: imageAnalysis.total,
        missingAlt: imageAnalysis.missingAlt,
        headings,
      },
      issues: this.issues,
      scores,
      meta: {
        ssl,
        hasRobotsTxt,
        hasSitemap,
        hasViewport,
        hasOpenGraph,
        hasTwitterCard,
        hasFavicon,
        language,
        charset,
      },
    };
  }

  // ============ TITLE TAG ANALYSIS ============
  // Like: $title = $dom->getElementsByTagName('title')->item(0)->textContent
  private analyzeTitle($: any): string | null {
    const title = $('title').text().trim();

    if (!title) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'CRITICAL',
        title: 'Missing title tag',
        description: 'No <title> tag found on the page.',
        recommendation: 'Add a unique, descriptive title tag between 50-60 characters.',
      });
      return null;
    }

    // Check title length — ideal is 50-60 characters
    if (title.length < 30) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'MEDIUM',
        title: 'Title tag too short',
        description: 'Title is ' + title.length + ' characters. Recommended: 50-60 characters.',
        recommendation: 'Expand your title to 50-60 characters to maximize visibility in search results.',
      });
    } else if (title.length > 60) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'MEDIUM',
        title: 'Title tag too long',
        description: 'Title is ' + title.length + ' characters. Google will truncate it after ~60 characters.',
        recommendation: 'Shorten your title to 60 characters or less so it displays fully in search results.',
      });
    }

    return title;
  }

  // ============ META DESCRIPTION ANALYSIS ============
  // Like: $meta = $xpath->query('//meta[@name="description"]/@content')
  private analyzeMetaDescription($: any): string | null {
    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || null;

    if (!metaDesc) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'HIGH',
        title: 'Missing meta description',
        description: 'No meta description found. Search engines will auto-generate one from page content.',
        recommendation: 'Add a compelling meta description between 150-160 characters that summarizes the page.',
      });
      return null;
    }

    if (metaDesc.length < 120) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'LOW',
        title: 'Meta description too short',
        description: 'Meta description is ' + metaDesc.length + ' characters. Recommended: 150-160.',
        recommendation: 'Expand your meta description to 150-160 characters to provide more context in search results.',
      });
    } else if (metaDesc.length > 160) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'LOW',
        title: 'Meta description too long',
        description: 'Meta description is ' + metaDesc.length + ' characters. Google will truncate it.',
        recommendation: 'Shorten your meta description to 160 characters or less.',
      });
    }

    return metaDesc;
  }

  // ============ H1 TAG ANALYSIS ============
  // A page should have exactly ONE H1 tag
  private analyzeH1($: any): string | null {
    const h1Tags = $('h1');

    if (h1Tags.length === 0) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'HIGH',
        title: 'Missing H1 tag',
        description: 'No H1 heading found on the page.',
        recommendation: 'Add a single H1 tag that describes the main topic of the page.',
      });
      return null;
    }

    if (h1Tags.length > 1) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'MEDIUM',
        title: 'Multiple H1 tags found',
        description: 'Found ' + h1Tags.length + ' H1 tags. Best practice is to have exactly one H1 per page.',
        recommendation: 'Use only one H1 tag for the main heading. Use H2-H6 for subheadings.',
      });
    }

    return h1Tags.first().text().trim();
  }

  // ============ ALL HEADINGS ANALYSIS ============
  // Checks heading hierarchy (H1 → H2 → H3 etc.)
  private analyzeHeadings($: any) {
    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[],
      h4: [] as string[],
      h5: [] as string[],
      h6: [] as string[],
    };

    // Collect all headings
    // Like: foreach($dom->getElementsByTagName('h1') as $h1) { $headings['h1'][] = $h1->textContent; }
    for (let i = 1; i <= 6; i++) {
      $('h' + i).each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text) {
          headings[('h' + i) as keyof typeof headings].push(text);
        }
      });
    }

    // Check if H2 exists without H1 (bad structure)
    if (headings.h1.length === 0 && headings.h2.length > 0) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'MEDIUM',
        title: 'Heading hierarchy broken',
        description: 'Found H2 tags but no H1 tag. Headings should follow a logical order.',
        recommendation: 'Add an H1 tag before using H2 tags. The hierarchy should be: H1 then H2 then H3, etc.',
      });
    }

    // Check if page has very few headings (poor structure)
    const totalHeadings = Object.values(headings).reduce((sum, arr) => sum + arr.length, 0);
    if (totalHeadings < 3) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'LOW',
        title: 'Few headings found',
        description: 'Only ' + totalHeadings + ' headings on the page. Well-structured content uses more headings.',
        recommendation: 'Break your content into sections using H2 and H3 headings for better readability and SEO.',
      });
    }

    return headings;
  }

  // ============ IMAGE ANALYSIS ============
  // Checks for missing alt text — critical for SEO and accessibility
  private analyzeImages($: any) {
    const images = $('img');
    let missingAlt = 0;

    images.each((_: any, el: any) => {
      const alt = $(el).attr('alt');
      // alt="" is acceptable (decorative image), undefined is not
      if (alt === undefined) {
        missingAlt++;
      }
    });

    if (missingAlt > 0) {
      this.issues.push({
        category: 'CONTENT',
        severity: missingAlt > 5 ? 'HIGH' : 'MEDIUM',
        title: 'Images missing alt text',
        description: missingAlt + ' out of ' + images.length + ' images are missing alt attributes.',
        recommendation: 'Add descriptive alt text to all images for better SEO and accessibility.',
      });
    }

    return { total: images.length, missingAlt };
  }

  // ============ LINK ANALYSIS ============
  // Counts internal vs external links
  private analyzeLinks($: any) {
    let internal = 0;
    let external = 0;

    $('a[href]').each((_: any, el: any) => {
      const href = $(el).attr('href') || '';

      // Skip anchors, javascript:, mailto:
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Check if link is internal or external
      // Like: Str::startsWith($href, $baseUrl) in Laravel
      if (href.startsWith('/') || href.startsWith(this.baseUrl)) {
        internal++;
      } else if (href.startsWith('http')) {
        external++;
      }
    });

    // Check if page has too few internal links
    if (internal < 3) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'MEDIUM',
        title: 'Few internal links',
        description: 'Only ' + internal + ' internal links found. Internal linking helps SEO.',
        recommendation: 'Add more internal links to related pages on your site to improve crawlability and SEO.',
      });
    }

    return { internal, external };
  }

  // ============ CANONICAL URL CHECK ============
  private analyzeCanonical($: any): string | null {
    const canonical = $('link[rel="canonical"]').attr('href') || null;

    if (!canonical) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'MEDIUM',
        title: 'Missing canonical tag',
        description: 'No canonical URL specified. This can cause duplicate content issues.',
        recommendation: 'Add <link rel="canonical" href="your-page-url"> to prevent duplicate content.',
      });
    }

    return canonical;
  }

  // ============ WORD COUNT ============
  // Counts words on the page (excluding HTML tags)
  private getWordCount($: any): number {
    // Get text content only (no HTML tags)
    // Like: strip_tags($html) in PHP
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').filter((w: any) => w.length > 0).length;

    if (wordCount < 300) {
      this.issues.push({
        category: 'CONTENT',
        severity: 'HIGH',
        title: 'Thin content',
        description: 'Page has only ' + wordCount + ' words. Search engines prefer pages with at least 300 words.',
        recommendation: 'Add more valuable content. Aim for at least 300-500 words for standard pages, 1000+ for blog posts.',
      });
    }

    return wordCount;
  }

  // ============ INDEXABILITY CHECK ============
  // Is the page blocked from search engines?
  private checkIndexability($: any): boolean {
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';

    if (robotsMeta.includes('noindex')) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'INFO',
        title: 'Page set to noindex',
        description: 'This page has a noindex meta tag. Search engines will not index it.',
        recommendation: 'If this page should appear in search results, remove the noindex tag.',
      });
      return false;
    }

    return true;
  }

  // ============ PAGE SPEED ANALYSIS ============
  private analyzeSpeed(loadTime: number, contentLength: number) {
    // Load time check
    if (loadTime > 3000) {
      this.issues.push({
        category: 'SPEED',
        severity: 'HIGH',
        title: 'Slow page load time',
        description: 'Page took ' + (loadTime / 1000).toFixed(1) + ' seconds to load. Recommended: under 3 seconds.',
        recommendation: 'Optimize images, enable compression, use a CDN, and minimize CSS/JS to improve load time.',
      });
    } else if (loadTime > 1500) {
      this.issues.push({
        category: 'SPEED',
        severity: 'MEDIUM',
        title: 'Page load time could be faster',
        description: 'Page took ' + (loadTime / 1000).toFixed(1) + ' seconds. Good pages load under 1.5 seconds.',
        recommendation: 'Consider optimizing images and enabling browser caching to further improve speed.',
      });
    }

    // Page size check
    const sizeKB = Math.round(contentLength / 1024);
    if (sizeKB > 3000) {
      this.issues.push({
        category: 'SPEED',
        severity: 'HIGH',
        title: 'Page size too large',
        description: 'Page is ' + sizeKB + 'KB. Recommended: under 3MB.',
        recommendation: 'Compress images, minify CSS/JS, and remove unnecessary code to reduce page size.',
      });
    }
  }

  // ============ SSL CHECK ============
  private analyzeSSL() {
    if (!this.url.startsWith('https')) {
      this.issues.push({
        category: 'TECHNICAL',
        severity: 'CRITICAL',
        title: 'Not using HTTPS',
        description: 'Site is not using SSL/HTTPS. Google penalizes non-HTTPS sites in rankings.',
        recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
      });
    }
  }

  // ============ HELPER CHECKS ============
  private checkViewport($: any): boolean {
    return $('meta[name="viewport"]').length > 0;
  }

  private checkOpenGraph($: any): boolean {
    return $('meta[property="og:title"]').length > 0;
  }

  private checkTwitterCard($: any): boolean {
    return $('meta[name="twitter:card"]').length > 0;
  }

  private checkFavicon($: any): boolean {
    return $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0;
  }

  // ============ ROBOTS.TXT CHECK ============
  // Like: Http::get($baseUrl . '/robots.txt')
  private async checkRobotsTxt(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl + '/robots.txt', {
        timeout: 5000,
        validateStatus: () => true,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // ============ SITEMAP CHECK ============
  // Like: Http::get($baseUrl . '/sitemap.xml')
  private async checkSitemap(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl + '/sitemap.xml', {
        timeout: 5000,
        validateStatus: () => true,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // ============ CALCULATE SCORES ============
  // Generates scores 0-100 based on issues found
  private calculateScores() {
    let technical = 100;
    let content = 100;
    let speed = 100;

    // Deduct points based on issue severity
    // Like: a scoring algorithm
    for (const issue of this.issues) {
      const deduction =
        issue.severity === 'CRITICAL' ? 20 :
        issue.severity === 'HIGH' ? 12 :
        issue.severity === 'MEDIUM' ? 6 :
        issue.severity === 'LOW' ? 3 : 0;

      // Deduct from the appropriate category
      if (issue.category === 'TECHNICAL' || issue.category === 'UX') {
        technical = Math.max(0, technical - deduction);
      } else if (issue.category === 'CONTENT') {
        content = Math.max(0, content - deduction);
      } else if (issue.category === 'SPEED') {
        speed = Math.max(0, speed - deduction);
      }
    }

    // Overall score = weighted average
    const overall = Math.round(technical * 0.35 + content * 0.35 + speed * 0.3);

    return { overall, technical, content, speed };
  }

  // ============ FAILED RESULT ============
  // Returns when we can't reach the website at all
  private createFailedResult(errorMessage: string): AuditResult {
    return {
      pageData: {
        url: this.url,
        statusCode: 0,
        title: null,
        metaDescription: null,
        h1: null,
        canonicalUrl: null,
        contentLength: 0,
        wordCount: 0,
        loadTime: 0,
        isIndexable: false,
        internalLinks: 0,
        externalLinks: 0,
        brokenLinks: 0,
        totalImages: 0,
        missingAlt: 0,
        headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
      },
      issues: [{
        category: 'TECHNICAL',
        severity: 'CRITICAL',
        title: 'Cannot reach website',
        description: 'Failed to fetch the website: ' + errorMessage,
        recommendation: 'Check if the URL is correct and the website is online.',
      }],
      scores: { overall: 0, technical: 0, content: 0, speed: 0 },
      meta: {
        ssl: false,
        hasRobotsTxt: false,
        hasSitemap: false,
        hasViewport: false,
        hasOpenGraph: false,
        hasTwitterCard: false,
        hasFavicon: false,
        language: null,
        charset: null,
      },
    };
  }
}
