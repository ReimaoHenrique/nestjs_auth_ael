import { Controller, Get, Query } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DashboardResponseDto, FluxoCaixaResponseDto } from './dto/financial.dto';

@ApiTags('Financial')
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas consolidadas do dashboard financeiro' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard(): Promise<DashboardResponseDto> {
    return this.financialService.getDashboardStats();
  }

  @Get('fluxo-caixa')
  @ApiOperation({ summary: 'Obter relatório de fluxo de caixa por período' })
  @ApiQuery({ name: 'inicio', required: true, description: 'Data de início (YYYY-MM-DD)', example: '2026-01-01' })
  @ApiQuery({ name: 'fim', required: true, description: 'Data de fim (YYYY-MM-DD)', example: '2026-12-31' })
  @ApiResponse({ status: 200, type: FluxoCaixaResponseDto })
  async getFluxoCaixa(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
  ): Promise<FluxoCaixaResponseDto> {
    return this.financialService.getFluxoCaixa(inicio, fim);
  }
}
