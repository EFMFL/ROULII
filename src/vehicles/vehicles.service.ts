import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string, createVehicleDto: CreateVehicleDto) {
    const normalizedPlate = this.normalizePlate(createVehicleDto.plate);

    try {
      return await this.prismaService.vehicle.create({
        data: {
          userId,
          brand: createVehicleDto.brand.trim(),
          model: createVehicleDto.model.trim(),
          color: createVehicleDto.color.trim(),
          plate: normalizedPlate,
        },
      });
    } catch (error: unknown) {
      this.handleVehiclePrismaError(error);
      throw error;
    }
  }

  async findMine(userId: string) {
    return this.prismaService.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    userId: string,
    vehicleId: string,
    updateVehicleDto: UpdateVehicleDto,
  ) {
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, userId: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicule introuvable');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos vehicules');
    }

    try {
      return await this.prismaService.vehicle.update({
        where: { id: vehicleId },
        data: {
          brand: updateVehicleDto.brand?.trim(),
          model: updateVehicleDto.model?.trim(),
          color: updateVehicleDto.color?.trim(),
          plate: updateVehicleDto.plate
            ? this.normalizePlate(updateVehicleDto.plate)
            : undefined,
        },
      });
    } catch (error: unknown) {
      this.handleVehiclePrismaError(error);
      throw error;
    }
  }

  async remove(userId: string, vehicleId: string): Promise<{ success: true }> {
    const vehicle = await this.prismaService.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, userId: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicule introuvable');
    }

    if (vehicle.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos vehicules',
      );
    }

    await this.prismaService.vehicle.delete({ where: { id: vehicleId } });

    return { success: true };
  }

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase().replace(/\s+/g, '-');
  }

  private handleVehiclePrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Cette plaque est deja enregistree');
    }
  }
}
