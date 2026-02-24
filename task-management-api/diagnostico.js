import { database } from './src/database/connection.js';
import bcrypt from 'bcryptjs';

async function diagnostico() {
  try {
    await database.init();

    console.log('🔍 Diagnóstico do Sistema de Login\n');

    // 1. Verificar usuários no banco
    console.log('📋 Usuários no banco:');
    const usuarios = await database.all(
      'SELECT id, nome, email, role, ativo FROM usuarios'
    );

    if (usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!');
      console.log('   Execute: npm run seed');
      await database.close();
      return;
    }

    usuarios.forEach(u => {
      console.log(`   - ${u.email} (${u.role}) - Ativo: ${u.ativo}`);
    });

    console.log('\n🔐 Testando Hash de Senha:\n');

    // 2. Testar a senha admin123
    const adminUser = usuarios.find(u => u.email === 'admin@empresa.com');
    
    if (!adminUser) {
      console.log('❌ Usuário admin@empresa.com não encontrado!');
      await database.close();
      return;
    }

    // Obter hash do banco
    const usuarioComSenha = await database.get(
      'SELECT senha FROM usuarios WHERE email = ?',
      ['admin@empresa.com']
    );

    if (!usuarioComSenha) {
      console.log('❌ Erro ao buscar senha do usuário!');
      await database.close();
      return;
    }

    console.log(`Hash no banco: ${usuarioComSenha.senha.substring(0, 20)}...`);

    // Testar comparação
    const senhaCorreta = await bcrypt.compare('admin123', usuarioComSenha.senha);
    console.log(`Teste com 'admin123': ${senhaCorreta ? '✅ CORRETO' : '❌ INCORRETO'}`);

    const senhaErrada = await bcrypt.compare('senha_errada', usuarioComSenha.senha);
    console.log(`Teste com 'senha_errada': ${senhaErrada ? '✅ (não deveria passar!)' : '❌ INCORRETO (esperado)'}`);

    console.log('\n✅ Diagnóstico completo!\n');

    console.log('📝 Se o login está falhando:');
    console.log('   1. Certifique-se que executou: npm run seed');
    console.log('   2. Use: email=admin@empresa.com password=admin123');
    console.log('   3. Verifique se o servidor está rodando: npm run dev\n');

    await database.close();

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    process.exit(1);
  }
}

diagnostico();
