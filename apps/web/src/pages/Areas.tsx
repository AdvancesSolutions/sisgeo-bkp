import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import type { Area, Location } from '@sigeo/shared';

const emptyForm = { locationId: '', name: '' };

export function Areas() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{ locationId: string; name: string }>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const [areasRes, locsRes] = await Promise.all([
        api.get<{ data: Area[] }>('/areas'),
        api.get<{ data: Location[] }>('/locations'),
      ]);
      const locs = locsRes.data.data ?? [];
      setAreas(areasRes.data.data ?? []);
      setLocations(locs);
      if (locs.length > 0 && !form.locationId) {
        setForm((f) => ({ ...f, locationId: locs[0].id }));
      }
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, 'Erro ao carregar áreas'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      setError('Preencha o nome da área.');
      return;
    }
    if (!editingId && !form.locationId) {
      setError('Selecione um local.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (editingId) {
        await api.patch(`/areas/${editingId}`, { name: form.name.trim() });
        setSuccess('Área atualizada.');
      } else {
        await api.post('/areas', {
          locationId: form.locationId,
          name: form.name.trim(),
        });
        setForm((f) => ({ ...emptyForm, locationId: f.locationId }));
        setShowForm(false);
        setSuccess('Área cadastrada.');
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao salvar área'));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (area: Area) => {
    setEditingId(area.id);
    setForm({ locationId: area.locationId, name: area.name });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm((f) => ({ ...emptyForm, locationId: f.locationId }));
    setShowForm(false);
  };

  const handleDelete = async (area: Area) => {
    if (!window.confirm(`Excluir a área "${area.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/areas/${area.id}`);
      setSuccess('Área excluída.');
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao excluir área'));
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Áreas</h1>
        <button
          type="button"
          onClick={() => (editingId ? cancelEdit() : setShowForm(!showForm))}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-slate-800 text-white text-sm font-medium shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition"
        >
          {showForm || editingId ? 'Cancelar' : 'Nova'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      {(showForm || editingId) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Editar área' : 'Nova área'}
          </h2>
          <form
            action="#"
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              save();
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <select
              value={form.locationId}
              onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 disabled:bg-slate-50 disabled:text-slate-500 transition"
              required={!editingId}
              disabled={!!editingId}
              title={editingId ? 'Local não pode ser alterado na edição' : undefined}
            >
              <option value="">Selecione o local</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <input
              placeholder="Nome da área"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/50 transition"
              required
            />
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-slate-700 text-white text-sm font-medium shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Nome</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Local</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 w-44">Ações</th>
            </tr>
          </thead>
          <tbody>
            {areas.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  Nenhuma área cadastrada.
                </td>
              </tr>
            ) : (
              areas.map((r) => {
                const loc = locations.find((l) => l.id === r.locationId);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{r.name}</td>
                    <td className="px-6 py-4 text-slate-600">{loc?.name ?? r.locationId}</td>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
