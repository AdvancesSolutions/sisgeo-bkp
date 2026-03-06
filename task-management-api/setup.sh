#!/bin/bash

# Script de setup rápido para Task Management API

echo "🚀 Iniciando setup da Task Management API..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale antes de continuar."
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"
echo ""

# Criar banco de dados
echo "🗄️  Criando banco de dados..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar banco de dados"
    exit 1
fi

echo "✅ Banco de dados criado"
echo ""

# Popular com dados de teste
echo "🌱 Populando banco com dados de teste..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Erro ao popular banco de dados"
    exit 1
fi

echo "✅ Banco de dados populado"
echo ""

echo "✨ Setup concluído com sucesso!"
echo ""
echo "📝 Credenciais padrão:"
echo "  Super Admin: admin@empresa.com / admin123"
echo "  Gestor TI: joao.ti@empresa.com / gestor123"
echo ""
echo "🚀 Para iniciar o servidor, execute:"
echo "   npm run dev"
echo ""
echo "📚 Documentação:"
echo "   - README.md: Descrição geral e instalação"
echo "   - TESTES.md: Guia de testes com exemplos de cURL"
echo "   - ARQUITETURA.md: Arquitetura, segurança e modelo de dados"
echo ""
