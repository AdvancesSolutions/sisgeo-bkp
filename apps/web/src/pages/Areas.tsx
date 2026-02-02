import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Area, Location } from '@sigeo/shared';

export function Areas() {
  const [showForm, setShowForm] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{ locationId: string; name: string }>({ locationId: '', name: '' });

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
      const err = e as { __authRedirect?: boolean; response?: { status?: number }; message?: string };
      if (err?.__authRedirect || err?.response?.status === 401) {
        setSuccess(null);
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError(e instanceof Error ? (e as Error).message : 'Erro ao carregar áreas.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.locationId || !form.name.trim()) {
      setError('Selecione um local e preencha o nome da área.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post('/areas', {
        locationId: form.locationId,
        name: form.name.trim(),
      });
      setForm((f) => ({ ...f, name: '' }));
      setShowForm(false);
      setSuccess('Área cadastrada.');
      await load();
    } catch (e: unknown) {
      let msg = 'Erro ao salvar.';
      if (e && typeof e === 'object' && 'response' in e) {
        const res = (e as { response?: { data?: { message?: string }; status?: number } }).response;
        msg = res?.data?.message ?? (res?.status === 401 ? 'Faça login novamente.' : `Erro ${res?.status ?? 'rede'}.`);
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
      setSuccess(null);
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
        <h1 className="text-xl font-bold text-slate-800">Áreas</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
        >
          {showForm ? 'Cancelar' : 'Nova'}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {showForm && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h2 className="font-medium text-slate-700 mb-3">Nova área</h2>
          <form
            action="#" 
            method="post"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              save();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <select
              value={form.locationId}
              onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
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
              className="px-3 py-2 border rounded-lg"
              required
            />
            <button
              type="button"
              disabled={saving}
              onClick={save}
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
              <th className="px-4 py-3 font-medium text-slate-700">Local</th>
              <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {areas.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-slate-500 text-center">Nenhuma área cadastrada.</td></tr>
            ) : (
              areas.map((r) => {
                const loc = locations.find((l) => l.id === r.locationId);
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{loc?.name ?? r.locationId}</td>
                    <td className="px-4 py-3">
                      <button type="button" className="text-slate-600 hover:underline mr-2">Editar</button>
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
