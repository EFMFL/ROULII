import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { RechargeWalletDto } from './dto/recharge-wallet.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';
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

  @Post('withdrawals')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Demander un retrait bancaire' })
  requestWithdrawal(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.walletService.requestWithdrawal(request.user.sub, dto);
  }

  @Post('recharge')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Recharger le wallet (simulation MVP)' })
  recharge(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RechargeWalletDto,
  ) {
    return this.walletService.recharge(request.user.sub, dto);
  }
}
