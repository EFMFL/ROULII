import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { WalletQueryDto } from './dto/wallet-query.dto';
import { WalletService } from './wallet.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Solde du portefeuille' })
  getBalance(@Req() request: AuthenticatedRequest) {
    return this.walletService.getBalance(request.user.sub);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historique des transactions' })
  getTransactions(
    @Req() request: AuthenticatedRequest,
    @Query() query: WalletQueryDto,
  ) {
    return this.walletService.getTransactions(request.user.sub, query);
  }
}
