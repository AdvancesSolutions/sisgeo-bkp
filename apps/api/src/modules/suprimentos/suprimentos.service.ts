import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Insumo } from '../../entities/insumo.entity';
import { Estoque } from '../../entities/estoque.entity';
import { ConsumoRegistro } from '../../entities/consumo-registro.entity';
import { PedidoCompra } from '../../entities/pedido-compra.entity';
import { Fornecedor } from '../../entities/fornecedor.entity';
import { ChecklistItem } from '../../entities/checklist-item.entity';
import { Task } from '../../entities/task.entity';

@Injectable()
export class SuprimentosService {
  constructor(
    @InjectRepository(Insumo)
    private readonly insumoRepo: Repository<Insumo>,
    @InjectRepository(Estoque)
    private readonly estoqueRepo: Repository<Estoque>,
    @InjectRepository(ConsumoRegistro)
    private readonly consumoRepo: Repository<ConsumoRegistro>,
    @InjectRepository(PedidoCompra)
    private readonly pedidoRepo: Repository<PedidoCompra>,
    @InjectRepository(Fornecedor)
    private readonly fornecedorRepo: Repository<Fornecedor>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepo: Repository<ChecklistItem>,
  ) {}

  /**
   * Abate estoque quando item de checklist marcado com insumo_id é salvo.
   * Chamado pelo ChecklistService.saveResponses.
   */
  async processarConsumo(
    checklistItemId: string,
    taskId: string,
    valueBool: boolean,
  ): Promise<{ abatido: boolean }> {
    if (!valueBool) return { abatido: false };

    const item = await this.checklistItemRepo.findOne({
      where: { id: checklistItemId },
      relations: ['insumo'],
    });
    if (!item?.insumoId || !item.insumo) return { abatido: false };

    const task = await this.estoqueRepo.manager
      .getRepository(Task)
      .findOne({ where: { id: taskId }, relations: ['area'] });
    if (!task?.areaId) return { abatido: false };

    let estoque = await this.estoqueRepo.findOne({
      where: { insumoId: item.insumoId, areaId: task.areaId },
    });
    if (!estoque) {
      estoque = this.estoqueRepo.create({
        id: uuid(),
        insumoId: item.insumoId,
        areaId: task.areaId,
        quantidade: 0,
      });
      await this.estoqueRepo.save(estoque);
    }

    const qtd = 1;
    if (estoque.quantidade < qtd) return { abatido: false };

    estoque.quantidade -= qtd;
    await this.estoqueRepo.save(estoque);

    const consumo = this.consumoRepo.create({
      id: uuid(),
      insumoId: item.insumoId,
      areaId: task.areaId,
      taskId,
      quantidade: qtd,
    });
    await this.consumoRepo.save(consumo);

    return { abatido: true };
  }

  /**
   * Verifica estoque após checkout e gera rascunho de pedido se atingir mínimo.
   * Chamado pelo TasksService quando status muda para DONE/IN_REVIEW.
   */
  async verificarEstoqueEgerarPedidos(areaId: string): Promise<number> {
    const estoques = await this.estoqueRepo.find({
      where: { areaId },
      relations: ['insumo'],
    });

    let gerados = 0;
    for (const e of estoques) {
      if (e.insumo && e.quantidade <= e.insumo.estoqueMinimo) {
        const jaExiste = await this.pedidoRepo.findOne({
          where: {
            insumoId: e.insumoId,
            areaId,
            status: 'RASCUNHO',
          },
        });
        if (jaExiste) continue;

        const qtdSugerida = Math.max(e.insumo.estoqueMinimo * 2, 10);
        const pedido = this.pedidoRepo.create({
          id: uuid(),
          insumoId: e.insumoId,
          areaId,
          fornecedorId: e.insumo.fornecedorPreferencialId,
          quantidade: qtdSugerida,
          status: 'RASCUNHO',
          precoUnitario: e.insumo.precoMedio,
          precoTotal: e.insumo.precoMedio ? Number(e.insumo.precoMedio) * qtdSugerida : null,
        });
        await this.pedidoRepo.save(pedido);
        gerados++;
      }
    }
    return gerados;
  }

  /**
   * Média de consumo dos últimos 30 dias por insumo/área.
   */
  async getConsumoMedio30Dias(insumoId: string, areaId: string): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const result = await this.consumoRepo
      .createQueryBuilder('c')
      .select('SUM(c.quantidade)', 'total')
      .where('c.insumo_id = :insumoId', { insumoId })
      .andWhere('c.area_id = :areaId', { areaId })
      .andWhere('c.created_at >= :since', { since })
      .getRawOne();

    const total = parseFloat(result?.total ?? '0');
    return total / 30;
  }

  /**
   * Predição: data em que estoque atingirá nível crítico.
   */
  async preverDataEstoqueCritico(
    insumoId: string,
    areaId: string,
  ): Promise<Date | null> {
    const estoque = await this.estoqueRepo.findOne({
      where: { insumoId, areaId },
      relations: ['insumo'],
    });
    if (!estoque?.insumo) return null;

    const consumoDiario = await this.getConsumoMedio30Dias(insumoId, areaId);
    if (consumoDiario <= 0) return null;

    const diasRestantes = estoque.quantidade / consumoDiario;
    const data = new Date();
    data.setDate(data.getDate() + Math.floor(diasRestantes));
    return data;
  }

  /**
   * Smart Quote: simula preços de 3 fornecedores.
   */
  async getCotacaoSimulada(insumoId: string): Promise<{
    insumo: { nome: string; precoMedio: number | null };
    fornecedores: { id: string; nome: string; preco: number; economiaPercentual: number }[];
  }> {
    const insumo = await this.insumoRepo.findOne({
      where: { id: insumoId },
      relations: ['fornecedorPreferencial'],
    });
    if (!insumo) throw new Error('Insumo não encontrado');

    const precoBase = Number(insumo.precoMedio ?? 100);
    const fornecedores = await this.fornecedorRepo.find({ take: 5 });

    const cotacoes = fornecedores.slice(0, 3).map((f, i) => {
      const variacao = 0.85 + Math.random() * 0.3;
      const preco = Math.round(precoBase * variacao * 100) / 100;
      const economia = precoBase > 0 ? ((precoBase - preco) / precoBase) * 100 : 0;
      return {
        id: f.id,
        nome: f.nome,
        preco,
        economiaPercentual: Math.round(economia * 10) / 10,
      };
    });

    return {
      insumo: { nome: insumo.nome, precoMedio: insumo.precoMedio ? Number(insumo.precoMedio) : null },
      fornecedores: cotacoes.sort((a, b) => a.preco - b.preco),
    };
  }

  async listInsumos(): Promise<Insumo[]> {
    return this.insumoRepo.find({
      relations: ['fornecedorPreferencial'],
      order: { nome: 'ASC' },
    });
  }

  async listFornecedores(): Promise<Fornecedor[]> {
    return this.fornecedorRepo.find({ order: { nome: 'ASC' } });
  }

  async listEstoque(areaId?: string): Promise<(Estoque & { insumo?: Insumo })[]> {
    const qb = this.estoqueRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.insumo', 'i')
      .leftJoinAndSelect('e.area', 'a')
      .orderBy('a.name')
      .addOrderBy('i.nome');
    if (areaId) qb.where('e.area_id = :areaId', { areaId });
    return qb.getMany();
  }

  async listPedidos(status?: string): Promise<PedidoCompra[]> {
    const qb = this.pedidoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.insumo', 'i')
      .leftJoinAndSelect('p.fornecedor', 'f')
      .leftJoinAndSelect('p.area', 'a')
      .orderBy('p.created_at', 'DESC');
    if (status) qb.where('p.status = :status', { status });
    return qb.getMany();
  }

  /**
   * Aprova pedido em um clique (RASCUNHO -> APROVADO).
   */
  async aprovarPedido(pedidoId: string): Promise<PedidoCompra> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: pedidoId },
      relations: ['insumo', 'fornecedor', 'area'],
    });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'RASCUNHO') throw new Error('Pedido já foi processado');
    pedido.status = 'APROVADO';
    await this.pedidoRepo.save(pedido);
    return pedido;
  }

  /**
   * Confirma recebimento (NF ou QR) e atualiza estoque.
   */
  async confirmarRecebimento(
    pedidoId: string,
    nfCodigo?: string,
  ): Promise<PedidoCompra> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id: pedidoId },
      relations: ['insumo', 'area'],
    });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status === 'RECEBIDO') throw new Error('Pedido já recebido');
    if (!pedido.areaId) throw new Error('Pedido sem área definida');

    let estoque = await this.estoqueRepo.findOne({
      where: { insumoId: pedido.insumoId, areaId: pedido.areaId },
    });
    if (!estoque) {
      estoque = this.estoqueRepo.create({
        id: uuid(),
        insumoId: pedido.insumoId,
        areaId: pedido.areaId,
        quantidade: 0,
      });
      await this.estoqueRepo.save(estoque);
    }

    estoque.quantidade += pedido.quantidade;
    await this.estoqueRepo.save(estoque);

    pedido.status = 'RECEBIDO';
    pedido.dataRecebimento = new Date();
    if (nfCodigo) pedido.nfCodigo = nfCodigo;
    await this.pedidoRepo.save(pedido);

    return pedido;
  }

  /**
   * Lista estoques críticos (quantidade <= estoque_minimo).
   */
  async listEstoquesCriticos(areaId?: string): Promise<(Estoque & { insumo?: Insumo })[]> {
    const qb = this.estoqueRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.insumo', 'i')
      .leftJoinAndSelect('e.area', 'a')
      .where('e.quantidade <= i.estoque_minimo')
      .orderBy('e.quantidade', 'ASC');
    if (areaId) qb.andWhere('e.area_id = :areaId', { areaId });
    return qb.getMany();
  }

  /**
   * Custo de insumos por setor (últimos 30 dias).
   */
  async getCustoPorSetor(
    filters?: { locationId?: string; organizationId?: string },
  ): Promise<{ areaId: string; areaName: string; custoTotal: number }[]> {
    const qb = this.consumoRepo
      .createQueryBuilder('c')
      .innerJoin('c.area', 'a')
      .innerJoin('c.insumo', 'i')
      .select('c.area_id', 'areaId')
      .addSelect('a.name', 'areaName')
      .addSelect('SUM(c.quantidade * COALESCE(i.preco_medio, 0))', 'custoTotal')
      .where('c.created_at >= :since', {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .groupBy('c.area_id')
      .addGroupBy('a.name');

    if (filters?.locationId) {
      qb.andWhere('a.location_id = :locId', { locId: filters.locationId });
    }
    if (filters?.organizationId) {
      qb.andWhere('a.organization_id = :orgId', { orgId: filters.organizationId });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      areaId: r.areaId,
      areaName: r.areaName,
      custoTotal: parseFloat(r.custoTotal ?? '0'),
    }));
  }
}
