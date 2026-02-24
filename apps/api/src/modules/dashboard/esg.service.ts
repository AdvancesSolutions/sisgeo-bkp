import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProdutoQuimico } from '../../entities/produto-quimico.entity';
import { EstoqueMovimentacao } from '../../entities/estoque-movimentacao.entity';
export interface EsgMetrics {
  pegadaHidricaM3: number;
  residuoKg: number;
  usosProdutos: number;
  economiaAguaEstimada: number;
  reducaoResiduos: number;
  evolucao: { mes: string; pegadaHidrica: number; residuo: number }[];
}

@Injectable()
export class EsgService {
  constructor(
    @InjectRepository(ProdutoQuimico)
    private readonly produtoRepo: Repository<ProdutoQuimico>,
    @InjectRepository(EstoqueMovimentacao)
    private readonly movRepo: Repository<EstoqueMovimentacao>,
  ) {}

  /**
   * Calcula métricas ESG (pegada hídrica, resíduos) baseado em produtos químicos e movimentações
   */
  async getImpactMetrics(organizationId?: string): Promise<EsgMetrics> {
    const produtos = await this.produtoRepo.find({
      where: organizationId ? { organizationId } : {},
    });

    const qb = this.movRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.material', 'mat')
      .where('m.tipo = :tipo', { tipo: 'SAIDA' })
      .andWhere('m.quantidade > 0');
    if (organizationId) qb.andWhere('m.organization_id = :orgId', { orgId: organizationId });
    const movimentacoes = await qb.getMany();

    let pegadaHidricaM3 = 0;
    let residuoKg = 0;
    let usosProdutos = 0;

    for (const mov of movimentacoes) {
      const pq = produtos.find((p) => p.name === (mov.material as { name?: string })?.name);
      if (pq) {
        const qty = mov.quantidade;
        usosProdutos += qty;
        if (pq.litrosPorUso && pq.pegadaHidricaPorLitro) {
          pegadaHidricaM3 += qty * pq.litrosPorUso * pq.pegadaHidricaPorLitro * 0.001;
        }
        if (pq.residuoKgPorUso) {
          residuoKg += qty * pq.residuoKgPorUso;
        }
      }
    }

    const evolucao = await this.getEvolucaoMensal(organizationId);

    return {
      pegadaHidricaM3: Math.round(pegadaHidricaM3 * 100) / 100,
      residuoKg: Math.round(residuoKg * 100) / 100,
      usosProdutos,
      economiaAguaEstimada: 0,
      reducaoResiduos: 0,
      evolucao,
    };
  }

  private async getEvolucaoMensal(organizationId?: string): Promise<{ mes: string; pegadaHidrica: number; residuo: number }[]> {
    const produtos = await this.produtoRepo.find({
      where: organizationId ? { organizationId } : {},
    });

    const qb = this.movRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.material', 'mat')
      .where('m.tipo = :tipo', { tipo: 'SAIDA' });
    if (organizationId) qb.andWhere('m.organization_id = :orgId', { orgId: organizationId });
    const movs = await qb.orderBy('m.created_at', 'ASC').getMany();

    const byMonth = new Map<string, { pegada: number; residuo: number }>();

    for (const m of movs) {
      const d = new Date(m.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) ?? { pegada: 0, residuo: 0 };
      const pq = produtos.find((p) => p.name === (m.material as { name?: string })?.name);
      if (pq) {
        cur.pegada += (pq.litrosPorUso ?? 0) * (pq.pegadaHidricaPorLitro ?? 0) * m.quantidade * 0.001;
        cur.residuo += (pq.residuoKgPorUso ?? 0) * m.quantidade;
      }
      byMonth.set(key, cur);
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        pegadaHidrica: Math.round(v.pegada * 100) / 100,
        residuo: Math.round(v.residuo * 100) / 100,
      }));
  }
}
