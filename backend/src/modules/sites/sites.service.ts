// ==============================================
// Sites Service — Business logic for site management
// Like: App\Services\SiteService or logic in SiteController
//
// This handles:
// 1. Creating a new site (linked to logged-in user)
// 2. Listing all sites for a user
// 3. Getting a single site (with ownership check)
// 4. Updating a site (only owner can update)
// 5. Deleting a site (only owner can delete)
// ==============================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  // CREATE — Add a new site
  // Like: Site::create(['user_id' => auth()->id(), ...$data])
  async create(userId: string, createSiteDto: CreateSiteDto) {
    return this.prisma.site.create({
      data: {
        userId,
        url: createSiteDto.url,
        name: createSiteDto.name,
        teamId: createSiteDto.teamId || null,
      },
    });
  }

  // READ ALL — Get all sites for the logged-in user
  // Like: Site::where('user_id', auth()->id())->latest()->get()
  async findAll(userId: string) {
    return this.prisma.site.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { audits: true },
        },
      },
    });
  }

  // READ ONE — Get single site with ownership check
  // Like: Site::where('id', $id)->where('user_id', auth()->id())->firstOrFail()
  async findOne(userId: string, siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: { audits: true },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (site.userId !== userId) {
      throw new ForbiddenException('You do not have access to this site');
    }

    return site;
  }

  // UPDATE — Update site details (owner only)
  // Like: $site->update($request->validated())
  async update(userId: string, siteId: string, updateSiteDto: UpdateSiteDto) {
    await this.findOne(userId, siteId);
    return this.prisma.site.update({
      where: { id: siteId },
      data: updateSiteDto,
    });
  }

  // DELETE — Remove a site (owner only)
  // Like: $site->delete()
  async remove(userId: string, siteId: string) {
    await this.findOne(userId, siteId);
    return this.prisma.site.delete({
      where: { id: siteId },
    });
  }
}
