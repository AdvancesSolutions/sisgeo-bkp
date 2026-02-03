import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import type { Material } from '@sigeo/shared';

type MaterialFormState = {
  name: string;
  unit: string;
  stock: string;
};

const emptyForm: MaterialFormState = { name: '', unit: '', stock: '' };

export function Materials() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialFormState>(emptyForm);

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<{ data: Material[] }>('/materials');
      setMaterials(res.data.data ?? []);
    } catch (e: unknown) {
      setSuccess(null);
      setError(getApiErrorMessage(e, 'Erro ao carregar materiais'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.unit.trim()) {
      setError('Preencha Nome e Unidade.');
      return;
    }
    const stockNum = form.stock.trim() ? Number(form.stock) : 0;
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError('Estoque deve ser um número maior ou igual a zero.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      if (editingId) {
        await api.patch(`/materials/${editingId}`, {
          name: form.name.trim(),
          unit: form.unit.trim(),
          stock: stockNum,
        });
        setSuccess('Material atualizado.');
      } else {
        await api.post('/materials', {
          name: form.name.trim(),
          unit: form.unit.trim(),
          stock: stockNum,
        });
        setForm(emptyForm);
        setShowForm(false);
        setSuccess('Material cadastrado.');
      }
      setEditingId(null);
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao salvar material'));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setForm({ name: m.name, unit: m.unit, stock: String(m.stock) });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleDelete = async (m: Material) => {
    if (!window.confirm(`Excluir o material "${m.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError(null);
      setSuccess(null);
      await api.delete(`/materials/${m.id}`);
      setSuccess('Material excluído.');
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Erro ao excluir material'));
      setSuccess(null);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Materiais / Estoque</h1>
        <button
          type="button"
          onClick={() => (editingId ? cancelEdit() : setShowForm(!showForm))}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
        >
          {showForm || editingId ? 'Cancelar' : 'Novo'}
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
      {(showForm || editingId) && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
          <h2 className="font-medium text-slate-700 mb-3">{editingId ? 'Editar material' : 'Novo material'}</h2>
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
            <input
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              placeholder="Unidade (un, kg, L)"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Estoque"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              min={0}
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
              <th className="px-4 py-3 font-medium text-slate-700">Unidade</th>
              <th className="px-4 py-3 font-medium text-slate-700">Estoque</th>
              <th className="px-4 py-3 font-medium text-slate-700 text-center w-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-slate-500 text-center">Nenhum material cadastrado.</td></tr>
            ) : (
              materials.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.unit}</td>
                  <td className="px-4 py-3">{r.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 shadow-sm border-0 cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-300 text-red-700 bg-white text-sm font-medium hover:bg-red-50 cursor-pointer"
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
