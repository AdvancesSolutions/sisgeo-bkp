import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeMedalha } from '../../entities/employee-medalha.entity';
import { EmployeePontos } from '../../entities/employee-pontos.entity';
import { Employee } from '../../entities/employee.entity';
import { ScoreDiario } from '../../entities/score-diario.entity';

export interface GamificationRankingRow {
  employeeId: string;
  employeeName: string;
  pontos: number;
  medalhasCount: number;
  medalhas: { name: string; icon: string }[];
  scoreMedio: number;
  posicao: number;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(EmployeeMedalha)
    private readonly medalhaRepo: Repository<EmployeeMedalha>,
    @InjectRepository(EmployeePontos)
    private readonly pontosRepo: Repository<EmployeePontos>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(ScoreDiario)
    private readonly scoreRepo: Repository<ScoreDiario>,
  ) {}

  /**
   * Ranking de gamificação (Employee Score) - medalhas e pontos
   */
  async getRanking(
    periodo: string,
    organizationId?: string,
  ): Promise<GamificationRankingRow[]> {
    const [year, month] = periodo.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const pontosList = await this.pontosRepo.find({
      where: { periodo, ...(organizationId && { organizationId }) },
      relations: ['employee'],
    });

    const medalhasList = await this.medalhaRepo
      .createQueryBuilder('em')
      .leftJoinAndSelect('em.employee', 'e')
      .leftJoinAndSelect('em.medalha', 'm')
      .where('em.earned_at >= :start', { start })
      .andWhere('em.earned_at <= :end', { end })
      .getMany();


    const scores = await this.scoreRepo
      .createQueryBuilder('s')
      .select('s.area_id')
      .addSelect('AVG(s.score_total)', 'avg_score')
      .where('s.reference_date >= :start', { start })
      .andWhere('s.reference_date <= :end', { end })
      .groupBy('s.area_id')
      .getRawMany();

    const employeeIds = new Set<string>();
    pontosList.forEach((p) => employeeIds.add(p.employeeId));
    medalhasList.forEach((m) => employeeIds.add(m.employeeId));

    const employees = await this.employeeRepo.find({
      where: Array.from(employeeIds).map((id) => ({ id })),
    });

    const byEmployee = new Map<
      string,
      { pontos: number; medalhas: { name: string; icon: string }[]; scores: number[] }
    >();

    for (const p of pontosList) {
      const cur = byEmployee.get(p.employeeId) ?? { pontos: 0, medalhas: [], scores: [] };
      cur.pontos += p.pontos;
      byEmployee.set(p.employeeId, cur);
    }

    for (const em of medalhasList) {
      const cur = byEmployee.get(em.employeeId) ?? { pontos: 0, medalhas: [], scores: [] };
      if (em.medalha) {
        cur.medalhas.push({ name: em.medalha.name, icon: em.medalha.icon });
      }
      byEmployee.set(em.employeeId, cur);
    }

    const rows: GamificationRankingRow[] = [];
    for (const [empId, data] of byEmployee.entries()) {
      const emp = employees.find((e) => e.id === empId);
      rows.push({
        employeeId: empId,
        employeeName: emp?.name ?? '-',
        pontos: data.pontos,
        medalhasCount: data.medalhas.length,
        medalhas: data.medalhas,
        scoreMedio: 0,
        posicao: 0,
      });
    }

    rows.sort((a, b) => b.pontos - a.pontos);
    rows.forEach((r, i) => (r.posicao = i + 1));

    return rows;
  }
}
