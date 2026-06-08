import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const statsByTipo = await this.prisma.financialTransaction.groupBy({
      by: ['tipo'],
      _sum: {
        valor: true,
      },
    }) as any[];

    const statsByStatus = await this.prisma.financialTransaction.groupBy({
      by: ['status'],
      _sum: {
        valor: true,
      },
    }) as any[];

    const receitas = Number(statsByTipo.find((s) => s.tipo === TransactionType.RECEITA)?._sum.valor || 0);
    const despesas = Number(statsByTipo.find((s) => s.tipo === TransactionType.DESPESA)?._sum.valor || 0);

    const pagas = Number(statsByStatus.find((s) => s.status === TransactionStatus.PAGO)?._sum.valor || 0);
    const pendentes = Number(statsByStatus.find((s) => s.status === TransactionStatus.PENDENTE)?._sum.valor || 0);
    const atrasadas = Number(statsByStatus.find((s) => s.status === TransactionStatus.ATRASADO)?._sum.valor || 0);

    const lucro = receitas > despesas ? receitas - despesas : 0;

    return {
      receitas,
      despesas,
      lucro,
      custo: despesas,
      saldo: receitas - despesas,
      pendentes,
      pagas,
      atrasadas,
    };
  }

  async getFluxoCaixa(inicio: string, fim: string) {
    const startDate = new Date(inicio);
    const endDate = new Date(fim);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        competencia: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        categoria: true,
        centroDeCusto: true,
        pessoa: true,
      },
    });

    const mappedTransactions = transactions.map(t => ({
      ...t,
      valor: t.valor.toString()
    })) as any[];

    const receitas = mappedTransactions.filter((t) => t.tipo === TransactionType.RECEITA);
    const despesas = mappedTransactions.filter((t) => t.tipo === TransactionType.DESPESA);

    const totalReceitas = receitas.reduce((acc, t) => acc + Number(t.valor), 0);
    const totalDespesas = despesas.reduce((acc, t) => acc + Number(t.valor), 0);

    const lucro = totalReceitas > totalDespesas ? totalReceitas - totalDespesas : 0;

    return {
      receitas,
      despesas,
      lucro,
      custo: totalDespesas,
      saldoPeriodo: totalReceitas - totalDespesas,
    };
  }
}
