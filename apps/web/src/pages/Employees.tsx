import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import type { Employee, Location } from '@sigeo/shared';

type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
type EmployeeFormState = {
  name: string;
  cpf: string;
  role: string;
  status: EmployeeStatus;
  unitId: string;
};

const emptyForm: EmployeeFormState = {
  name: '',
  cpf: '',
  role: '',
  status: 'ACTIVE',
  unitId: '',
};

export function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const [empRes, locRes] = await Promise.all([
        api.get<{ data: Employee[] }>('/employees'),
        api.get<{ data: Location[] }>('/locations'),
      ]);
      setEmployees(empRes.data.data ?? []);
      setLocations(locRes.data.data ?? []);
      if ((locRes.data.data?.length ?? 0) > 0 && !form.unitId) {
        setForm((f) => ({ ...f, unitId: locRes.data.data![0].id }));
      }
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, 'Erro ao carregar funcionários'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.unitId) {
      setError('Preencha Nome, Função e Unidade.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        name: form.name.trim(),
        cpf: form.cpf.trim() || undefined,
        role: form.role.trim(),
        status: form.status,
        unitId: form.unitId,
      };
      if (editingId) {
        await api.patch(`/employees/${editingId}`, payload);
        setSuccess('Funcionário atualizado.');
      } else {
        await api.post('/employees', payload);
        setForm((f) => ({ ...emptyForm, unitId: f.unitId }));
        setShowForm(false);
        setSuccess('Funcionário cadastrado.');
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao salvar funcionário'));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      cpf: emp.cpf ?? '',
      role: emp.role,
      status: emp.status as EmployeeStatus,
      unitId: emp.unitId,
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, unitId: f.unitId }));
    setShowForm(false);
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    ON_LEAVE: 'Afastado',
  };

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Excluir o funcionário "${emp.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/employees/${emp.id}`);
      setSuccess('Funcionário excluído.');
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao excluir funcionário'));
      setSuccess(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-slate-500 text-sm font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Funcionários</h1>
        <button
          type="button"
          onClick={() => (editingId ? cancelEdit() : setShowForm(!showForm))}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-slate-800 text-white text-sm font-medium shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition"
        >
          {showForm || editingId ? 'Cancelar' : 'Novo'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {/* Form card */}
      {(showForm || editingId) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Editar funcionário' : 'Novo funcionário'}
          </h2>
          <form
            action="#"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
              required
            />
            <input
              placeholder="CPF"
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
            />
            <input
              placeholder="Função"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
              required
            />
            <select
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
              required
            >
              <option value="">Unidade</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EmployeeStatus }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="ON_LEAVE">Afastado</option>
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (form.name.trim() && form.role.trim() && form.unitId) {
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                } else {
                  setError('Preencha Nome, Função e Unidade.');
                }
              }}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-slate-700 text-white text-sm font-medium shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Nome</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">CPF</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Função</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 w-44">Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            ) : (
              employees.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{r.name}</td>
                  <td className="px-6 py-4 text-slate-600">{r.cpf ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{r.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        r.status === 'ACTIVE'
                          ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700'
                          : 'text-slate-500'
                      }
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-slate-700 text-white shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="inline-flex items-center justify-center rounded-lg border-2 border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition"
                      >
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
