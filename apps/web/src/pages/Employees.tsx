import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Employee, Location } from '@sigeo/shared';

export function Employees() {
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', cpf: '', role: '', status: 'ACTIVE' as const, unitId: '' });

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
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
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
      await api.post('/employees', {
        name: form.name.trim(),
        cpf: form.cpf.trim() || undefined,
        role: form.role.trim(),
        status: form.status,
        unitId: form.unitId,
      });
      setForm({ name: '', cpf: '', role: '', status: 'ACTIVE', unitId: form.unitId });
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg || (e instanceof Error ? e.message : 'Erro ao salvar'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Funcionários</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
        >
          {showForm ? 'Cancelar' : 'Novo'}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {showForm && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h2 className="font-medium text-slate-700 mb-3">Novo funcionário</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              placeholder="CPF"
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              placeholder="Função"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <select
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Unidade</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' }))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="ON_LEAVE">Afastado</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-700">Nome</th>
              <th className="px-4 py-3 font-medium text-slate-700">CPF</th>
              <th className="px-4 py-3 font-medium text-slate-700">Função</th>
              <th className="px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-500 text-center">Nenhum funcionário cadastrado.</td></tr>
            ) : (
              employees.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.cpf ?? '-'}</td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3">
                    <span className={r.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-500'}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-slate-600 hover:underline mr-2">Editar</button>
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
