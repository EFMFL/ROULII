import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        firstName: true,
        photoUrl: true,
        rating: true,
        reliabilityScore: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async updateMe(userId: string, updateMeDto: UpdateMeDto) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        firstName: updateMeDto.firstName,
        photoUrl: updateMeDto.photoUrl,
      },
      select: {
        id: true,
        firstName: true,
        photoUrl: true,
        rating: true,
        reliabilityScore: true,
      },
    });
  }

  async updateFcmToken(userId: string, updateFcmTokenDto: UpdateFcmTokenDto) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { fcmToken: updateFcmTokenDto.token },
      select: { id: true, fcmToken: true },
    });
  }

  async getPublicProfile(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        photoUrl: true,
        rating: true,
        reliabilityScore: true,
        _count: {
          select: {
            drivenTrips: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      rating: user.rating,
      reliabilityScore: user.reliabilityScore,
      tripsCount: user._count.drivenTrips,
    };
  }

  async anonymizeMe(userId: string): Promise<{ success: true }> {
    const anonymousPhone = `deleted-${Date.now()}-${userId.slice(0, 8)}`;

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        phone: anonymousPhone,
        firstName: 'Deleted User',
        photoUrl: null,
        fcmToken: null,
        refreshTokenHash: null,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  }
}
