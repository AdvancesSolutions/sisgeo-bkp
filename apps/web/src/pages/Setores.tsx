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
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Breadcrumbs, Link } from '@mui/material';
import NiPlus from '@/icons/nexture/ni-plus';
import NiBinEmpty from '@/icons/nexture/ni-bin-empty';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Setor {
  id: string;
  nome: string;
}

export function Setores() {
  const { user } = useAuth();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: '',
  });

  // Verificação de acesso - Apenas SUPER_ADMIN
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (!user) {
    return (
      <Box className="flex items-center justify-center min-h-[50vh]">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <Typography variant="h5" className="text-red-500">Acesso Negado (403)</Typography>
        <Typography>Apenas Super Admins podem gerenciar setores.</Typography>
      </Box>
    );
  }

  const load = async () => {
    try {
      setError(null);
      const res = await api.get<{ data: Setor[] }>('/setores');
      setSetores(res.data.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao carregar setores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('Nome do setor é obrigatório');
      return;
    }

    try {
      await api.post('/setores', {
        nome: form.nome,
      });

      setSuccess('Setor criado com sucesso!');
      setForm({ nome: '' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar setor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este setor?')) return;

    try {
      await api.delete(`/setores/${id}`);
      setSuccess('Setor deletado com sucesso!');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao deletar setor');
    }
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
          Setores / Áreas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={<NiPlus size="medium" />}
          onClick={() => setShowForm(true)}
        >
          Novo Setor
        </Button>
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography>Setores</Typography>
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

      {/* Lista de Setores */}
      <Card>
        <CardContent>
          <List>
            {setores.length === 0 ? (
              <Typography className="text-center text-gray-500 py-4">
                Nenhum setor cadastrado
              </Typography>
            ) : (
              setores.map((setor) => (
                <ListItem
                  key={setor.id}
                  className="border-b last:border-b-0 flex items-center justify-between"
                >
                  <ListItemText
                    primary={setor.nome}
                    secondary={<Typography variant="body2" className="text-gray-500">ID: {setor.id}</Typography>}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(setor.id)}
                  >
                    <NiBinEmpty size="medium" />
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* Modal de Criar Setor */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Setor</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreate} className="flex flex-col gap-4 pt-4">
            <TextField
              label="Nome do Setor"
              placeholder="ex: Tecnologia, Vendas, RH"
              size="small"
              required
              fullWidth
              value={form.nome}
              onChange={(e) => setForm({ nome: e.target.value })}
              autoFocus
            />

            <Typography variant="body2" className="text-gray-500">
              Use nomes claros como: TI, Vendas, RH, Operações, etc.
            </Typography>

            <Box className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Criar Setor
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
