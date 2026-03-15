import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminTripsQueryDto } from './dto/admin-trips-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Lister tous les utilisateurs' })
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspendre un compte utilisateur' })
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/unsuspend')
  @ApiOperation({ summary: 'Rétablir un compte utilisateur' })
  unsuspendUser(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Lister tous les trajets' })
  listTrips(@Query() query: AdminTripsQueryDto) {
    return this.adminService.listTrips(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de la plateforme' })
  getStats() {
    return this.adminService.getStats();
  }
}
