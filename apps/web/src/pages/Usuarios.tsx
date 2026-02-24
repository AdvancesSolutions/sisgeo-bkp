import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import { Breadcrumbs, Link } from '@mui/material';
import NiPlus from '@/icons/nexture/ni-plus';
import NiPen from '@/icons/nexture/ni-pen';
import NiBinEmpty from '@/icons/nexture/ni-bin-empty';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  setor_id?: string;
  ativo: boolean;
}

interface Setor {
  id: string;
  nome: string;
}

export function Usuarios() {
  const { user } = useAuth();
  
  // Verificação de acesso - declare antes de usar
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isGestor = user?.role === 'GESTOR';
  const canAccess = isSuperAdmin || isGestor;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: isGestor ? 'FUNCIONARIO' : 'GESTOR',
    setor_id: isGestor ? (user?.setor_id as string) : '',
  });
  const [editForm, setEditForm] = useState({
    nome: '',
    email: '',
    ativo: true,
  });
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    senhaNova: '',
    confirmacao: '',
  });
  
  if (!user) {
    return (
      <Box className="flex items-center justify-center min-h-[50vh]">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!canAccess) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <Typography variant="h5" className="text-red-500">Acesso Negado (403)</Typography>
        <Typography>Apenas Super Admins e Gestores podem gerenciar usuários.</Typography>
        <Typography variant="body2" className="text-gray-500 font-mono">
          Seu role: {user?.role || 'desconhecido'}
        </Typography>
      </Box>
    );
  }

  const load = async () => {
    try {
      setError(null);
      const [usersRes, setoresRes] = await Promise.all([
        api.get<{ data: Usuario[] }>('/usuarios'),
        // Gestores só veem setores (não precisa filtrar)
        isSuperAdmin 
          ? api.get<{ data: Setor[] }>('/setores')
          : Promise.resolve({ data: { data: [] } }),
      ]);
      setUsuarios(usersRes.data.data ?? []);
      setSetores(setoresRes.data.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.senha) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (form.role !== 'SUPER_ADMIN' && !form.setor_id) {
      setError('Selecione um setor');
      return;
    }

    try {
      await api.post('/usuarios', {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        role: form.role,
        setor_id: form.setor_id || null,
      });

      setSuccess('Usuário criado com sucesso!');
      setForm({ nome: '', email: '', senha: '', role: 'GESTOR', setor_id: '' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  const openEditUser = (usr: Usuario) => {
    setEditingId(usr.id);
    setEditForm({
      nome: usr.nome,
      email: usr.email,
      ativo: usr.ativo,
    });
    setShowEditForm(true);
  };

  const handleEditUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.nome || !editForm.email) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      await api.patch(`/usuarios/${editingId}`, {
        nome: editForm.nome,
        email: editForm.email,
        ativo: editForm.ativo,
      });

      setSuccess('Usuário atualizado com sucesso!');
      setShowEditForm(false);
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao atualizar usuário');
    }
  };

  const openPasswordForm = (id: string) => {
    setEditingId(id);
    setPasswordForm({
      senhaAtual: '',
      senhaNova: '',
      confirmacao: '',
    });
    setShowPasswordForm(true);
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: Super Admin só precisa preencher nova senha
    if (!isSuperAdmin && !passwordForm.senhaAtual) {
      setError('Preencha a senha atual');
      return;
    }

    if (!passwordForm.senhaNova) {
      setError('Preencha a nova senha');
      return;
    }

    if (passwordForm.senhaNova !== passwordForm.confirmacao) {
      setError('As senhas não conferem');
      return;
    }

    if (passwordForm.senhaNova.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await api.post(`/usuarios/${editingId}/alterar-senha`, {
        senhaAtual: passwordForm.senhaAtual,
        senhaNova: passwordForm.senhaNova,
      });

      setSuccess('Senha alterada com sucesso!');
      setShowPasswordForm(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      await api.delete(`/usuarios/${id}`);
      setSuccess('Usuário deletado com sucesso!');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao deletar usuário');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'GESTOR':
        return 'Gestor';
      case 'FUNCIONARIO':
        return 'Funcionário';
      default:
        return role;
    }
  };

  const getSetorName = (setor_id?: string) => {
    if (!setor_id) return '—';
    return setores.find((s) => s.id === setor_id)?.nome || setor_id;
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[50vh]">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box className="mb-4 flex flex-row items-center justify-between">
        <Typography variant="h6" component="h1" className="text-text-primary">
          Usuários
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<NiPlus size="medium" />}
          onClick={() => setShowForm(true)}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography>Usuários</Typography>
      </Breadcrumbs>

      {/* Alertas */}
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Lista de Usuários */}
      <Card>
        <CardContent>
          <List>
            {usuarios.length === 0 ? (
              <Typography className="text-center text-gray-500 py-4">
                Nenhum usuário cadastrado
              </Typography>
            ) : (
              usuarios.map((usr) => (
                <ListItem
                  key={usr.id}
                  className="border-b last:border-b-0 flex justify-between items-start"
                  secondaryAction={
                    <Box className="flex gap-1">
                      <IconButton
                        edge="end"
                        aria-label="editar"
                        title="Editar usuário"
                        onClick={() => openEditUser(usr)}
                      >
                        <NiPen size="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="alterar senha"
                        title="Alterar senha"
                        onClick={() => openPasswordForm(usr.id)}
                      >
                        <Typography variant="caption">🔒</Typography>
                      </IconButton>
                      {isSuperAdmin && (
                        <IconButton
                          edge="end"
                          aria-label="deletar"
                          title="Deletar usuário"
                          onClick={() => handleDeleteUsuario(usr.id)}
                        >
                          <NiBinEmpty size="small" />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box className="flex items-center gap-2">
                        {usr.nome}
                        <Chip
                          label={getRoleLabel(usr.role)}
                          size="small"
                          color={usr.role === 'SUPER_ADMIN' ? 'error' : 'primary'}
                          variant="outlined"
                        />
                        {!usr.ativo && (
                          <Chip label="Inativo" size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box className="mt-1 text-sm">
                        <div>Email: {usr.email}</div>
                        <div>Setor: {getSetorName(usr.setor_id)}</div>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* Modal de Criar Usuário */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateUsuario} className="flex flex-col gap-4 pt-4">
            <TextField
              label="Nome"
              size="small"
              required
              fullWidth
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />

            <TextField
              label="Email"
              type="email"
              size="small"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />

            <TextField
              label="Senha"
              type="password"
              size="small"
              required
              fullWidth
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de Usuário</InputLabel>
              <Select
                value={form.role}
                label="Tipo de Usuário"
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value, setor_id: '' }))
                }
              >
                {isSuperAdmin && <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>}
                {isSuperAdmin && <MenuItem value="GESTOR">Gestor</MenuItem>}
                <MenuItem value="FUNCIONARIO">Funcionário</MenuItem>
              </Select>
            </FormControl>

            {form.role !== 'SUPER_ADMIN' && (
              <FormControl size="small" fullWidth>
                <InputLabel>Setor</InputLabel>
                <Select
                  value={form.setor_id}
                  label="Setor"
                  disabled={isGestor}
                  onChange={(e) => setForm((f) => ({ ...f, setor_id: e.target.value }))}
                >
                  {(isGestor && user?.setor_id ? [{ id: user.setor_id, nome: 'Seu Setor' }] : setores).map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nome}
                    </MenuItem>
                  ))}
                </Select>
                {isGestor && (
                  <Typography variant="caption" className="text-gray-500 mt-1">
                    Você só pode criar funcionários em seu setor
                  </Typography>
                )}
              </FormControl>
            )}

            <Box className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Criar Usuário
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Usuário */}
      <Dialog open={showEditForm} onClose={() => setShowEditForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleEditUsuario} className="flex flex-col gap-4 pt-4">
            <TextField
              label="Nome"
              size="small"
              required
              fullWidth
              value={editForm.nome}
              onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
            />

            <TextField
              label="Email"
              type="email"
              size="small"
              required
              fullWidth
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.ativo ? 'ativo' : 'inativo'}
                label="Status"
                onChange={(e) => setEditForm((f) => ({ ...f, ativo: e.target.value === 'ativo' }))}
              >
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>

            <Box className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setShowEditForm(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Salvar Alterações
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Alterar Senha */}
      <Dialog open={showPasswordForm} onClose={() => setShowPasswordForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAlterarSenha} className="flex flex-col gap-4 pt-4">
            {!isSuperAdmin && (
              <TextField
                label="Senha Atual"
                type="password"
                size="small"
                required
                fullWidth
                value={passwordForm.senhaAtual}
                onChange={(e) => setPasswordForm((f) => ({ ...f, senhaAtual: e.target.value }))}
              />
            )}

            <TextField
              label="Nova Senha"
              type="password"
              size="small"
              required
              fullWidth
              value={passwordForm.senhaNova}
              onChange={(e) => setPasswordForm((f) => ({ ...f, senhaNova: e.target.value }))}
            />

            <TextField
              label="Confirmar Senha"
              type="password"
              size="small"
              required
              fullWidth
              value={passwordForm.confirmacao}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmacao: e.target.value }))}
            />

            <Typography variant="caption" className="text-gray-500">
              Mínimo de 6 caracteres
            </Typography>

            <Box className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setShowPasswordForm(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Alterar Senha
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
