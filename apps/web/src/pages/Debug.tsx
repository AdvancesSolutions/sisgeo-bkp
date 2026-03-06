import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Debug() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Box className="p-6">
      <Typography variant="h4" className="mb-4">
        🔍 Debug - Informações do Usuário
      </Typography>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="h6" className="mb-2">
            Autenticação:
          </Typography>
          <Typography className="text-lg font-mono">
            isAuthenticated: <strong>{isAuthenticated ? '✅ true' : '❌ false'}</strong>
          </Typography>
          <Typography className="text-lg font-mono">
            user: <strong>{user ? '✅ existe' : '❌ nulo'}</strong>
          </Typography>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-2">
              Dados do Usuário:
            </Typography>
            <Typography className="text-base font-mono">
              ID: <strong>{user.id}</strong>
            </Typography>
            <Typography className="text-base font-mono">
              Nome: <strong>{user.name}</strong>
            </Typography>
            <Typography className="text-base font-mono">
              Email: <strong>{user.email}</strong>
            </Typography>
            <Typography className="text-base font-mono">
              Role: <strong>{user.role}</strong>
            </Typography>
            <Typography className="text-base font-mono">
              Role === 'SUPER_ADMIN': <strong>{user.role === 'SUPER_ADMIN' ? '✅ true' : '❌ false'}</strong>
            </Typography>
            <Typography className="text-base font-mono">
              Objeto completo: <code className="block bg-gray-100 p-2 mt-2 text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </code>
            </Typography>
          </CardContent>
        </Card>
      )}

      <Button variant="contained" component={Link} to="/dashboard" className="mt-4">
        Voltar ao Dashboard
      </Button>
    </Box>
  );
}
