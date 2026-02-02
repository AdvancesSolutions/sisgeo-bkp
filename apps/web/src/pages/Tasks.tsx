import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Plus } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Task, Area, Employee } from '@sigeo/shared';

type TaskFormState = {
  areaId: string;
  employeeId: string;
  scheduledDate: string;
  title: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  IN_REVIEW: 'Em validação',
  DONE: 'Concluída',
  REJECTED: 'Rejeitada',
};

export function Tasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>({
    areaId: '',
    employeeId: '',
    scheduledDate: '',
    title: '',
  });

  const load = async () => {
    try {
      setError(null);
      const [tasksRes, areasRes, empsRes] = await Promise.all([
        api.get<{ data: Task[] }>('/tasks'),
        api.get<{ data: Area[] }>('/areas'),
        api.get<{ data: Employee[] }>('/employees'),
      ]);
      const a = areasRes.data.data ?? [];
      setTasks(tasksRes.data.data ?? []);
      setAreas(a);
      setEmployees(empsRes.data.data ?? []);
      if (a.length > 0 && !form.areaId) {
        setForm((f) => ({ ...f, areaId: a[0].id }));
      }
    } catch (e: unknown) {
      const err = e as { __authRedirect?: boolean; response?: { status?: number }; message?: string };
      if (err?.__authRedirect || err?.response?.status === 401) {
        setSuccess(null);
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError(e instanceof Error ? (e as Error).message : 'Erro ao carregar tarefas.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.areaId || !form.scheduledDate) {
      setError('Selecione a área e a data.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post('/tasks', {
        areaId: form.areaId,
        employeeId: form.employeeId || undefined,
        scheduledDate: form.scheduledDate,
        title: form.title || undefined,
      });
      setForm((f) => ({ ...f, scheduledDate: '', title: '' }));
      setShowForm(false);
      setSuccess('Tarefa cadastrada.');
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

  const formatDate = (d: Date | string) => {
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return String(d);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Tarefas / Serviços</h1>
        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancelar' : 'Nova'}
          </button>
        )}
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
          <h2 className="font-medium text-slate-700 mb-3">Nova tarefa</h2>
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
              value={form.areaId}
              onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Funcionário (opcional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              placeholder="Título (opcional)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
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
              <th className="px-4 py-3 font-medium text-slate-700">Título</th>
              <th className="px-4 py-3 font-medium text-slate-700">Data</th>
              <th className="px-4 py-3 font-medium text-slate-700">Status</th>
              <th className="px-4 py-3 font-medium text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-slate-500 text-center">Nenhuma tarefa cadastrada.</td></tr>
            ) : (
              tasks.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{r.title ?? '(sem título)'}</td>
                  <td className="px-4 py-3">{formatDate(r.scheduledDate)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/tasks/${r.id}`)}
                      className="flex items-center gap-1 text-sky-600 hover:underline text-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver
                    </button>
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
