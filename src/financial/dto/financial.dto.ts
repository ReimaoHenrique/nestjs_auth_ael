import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ example: 0 })
  receitas: number;

  @ApiProperty({ example: 110000 })
  despesas: number;

  @ApiProperty({ example: 0 })
  lucro: number;

  @ApiProperty({ example: 110000 })
  custo: number;

  @ApiProperty({ example: -110000 })
  saldo: number;

  @ApiProperty({ example: 0 })
  pendentes: number;

  @ApiProperty({ example: 110000 })
  pagas: number;

  @ApiProperty({ example: 0 })
  atrasadas: number;
}

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  descricao: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CostCenterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PersonDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  documento: string | null;

  @ApiProperty()
  email: string | null;

  @ApiProperty()
  telefone: string | null;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  descricao: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  valor: string;

  @ApiProperty()
  competencia: Date;

  @ApiProperty()
  dataVencimento: Date;

  @ApiProperty()
  dataPagamento: Date | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  formaPagamento: string | null;

  @ApiProperty()
  origem: string;

  @ApiProperty()
  observacao: string | null;

  @ApiProperty()
  comprovanteUrl: string | null;

  @ApiProperty()
  chaveNfe: string | null;

  @ApiProperty()
  centroDeCustoId: string;

  @ApiProperty()
  categoriaId: string;

  @ApiProperty()
  pessoaId: string;

  @ApiProperty()
  contratoFixoId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => CategoryDto })
  categoria: CategoryDto;

  @ApiProperty({ type: () => CostCenterDto })
  centroDeCusto: CostCenterDto;

  @ApiProperty({ type: () => PersonDto })
  pessoa: PersonDto;
}

export class FluxoCaixaResponseDto {
  @ApiProperty({ type: [TransactionDto] })
  receitas: TransactionDto[];

  @ApiProperty({ type: [TransactionDto] })
  despesas: TransactionDto[];

  @ApiProperty({ example: 0 })
  lucro: number;

  @ApiProperty({ example: 110000 })
  custo: number;

  @ApiProperty({ example: -110000 })
  saldoPeriodo: number;
}
