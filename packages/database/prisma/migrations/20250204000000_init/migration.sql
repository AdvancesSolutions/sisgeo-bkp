-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PerfilAcesso" AS ENUM ('ADMIN', 'SUPERVISOR', 'AUXILIAR');

-- CreateEnum
CREATE TYPE "ClassificacaoRisco" AS ENUM ('CRITICO', 'SEMICRITICO', 'NAO_CRITICO');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EXECUCAO', 'CONCLUIDA', 'ATRASADA', 'REPROVADA');

-- CreateEnum
CREATE TYPE "EtapaEvidencia" AS ENUM ('CHECKIN', 'CHECKOUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilAcesso" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "colaborador_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "setor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "classificacao_risco" "ClassificacaoRisco" NOT NULL,
    "frequencia_limpeza" TEXT,
    "lat" DOUBLE PRECISION,
    "long" DOUBLE PRECISION,
    "raio_geofencing" DOUBLE PRECISION,
    "qr_code_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "setor_id" TEXT NOT NULL,
    "colaborador_id" TEXT,
    "data_programada" DATE NOT NULL,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "tempo_estimado" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_tarefa" (
    "id" TEXT NOT NULL,
    "tarefa_id" TEXT NOT NULL,
    "uuid_local" TEXT,
    "checkin_at" TIMESTAMP(3),
    "checkin_lat" DOUBLE PRECISION,
    "checkin_long" DOUBLE PRECISION,
    "checkout_at" TIMESTAMP(3),
    "checkout_lat" DOUBLE PRECISION,
    "checkout_long" DOUBLE PRECISION,
    "assinatura_digital" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execucoes_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_itens" (
    "id" TEXT NOT NULL,
    "tarefa_id" TEXT NOT NULL,
    "item_nome" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "execucao_id" TEXT NOT NULL,
    "uuid_local" TEXT,
    "url_s3" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etapa" "EtapaEvidencia" NOT NULL,
    "metadata_foto" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "tabela_afetada" TEXT NOT NULL,
    "valor_antigo" JSONB,
    "valor_novo" JSONB,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nao_conformidades" (
    "id" TEXT NOT NULL,
    "execucao_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "status_correcao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nao_conformidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_colaborador_id_key" ON "users"("colaborador_id");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_cpf_key" ON "colaboradores"("cpf");

-- CreateIndex
CREATE INDEX "colaboradores_setor_id_idx" ON "colaboradores"("setor_id");

-- CreateIndex
CREATE INDEX "colaboradores_ativo_idx" ON "colaboradores"("ativo");

-- CreateIndex
CREATE INDEX "setores_classificacao_risco_idx" ON "setores"("classificacao_risco");

-- CreateIndex
CREATE INDEX "setores_frequencia_limpeza_idx" ON "setores"("frequencia_limpeza");

-- CreateIndex
CREATE INDEX "tarefas_status_idx" ON "tarefas"("status");

-- CreateIndex
CREATE INDEX "tarefas_data_programada_idx" ON "tarefas"("data_programada");

-- CreateIndex
CREATE INDEX "tarefas_colaborador_id_idx" ON "tarefas"("colaborador_id");

-- CreateIndex
CREATE INDEX "tarefas_setor_id_idx" ON "tarefas"("setor_id");

-- CreateIndex
CREATE INDEX "tarefas_status_data_programada_idx" ON "tarefas"("status", "data_programada");

-- CreateIndex
CREATE INDEX "tarefas_colaborador_id_data_programada_idx" ON "tarefas"("colaborador_id", "data_programada");

-- CreateIndex
CREATE UNIQUE INDEX "execucoes_tarefa_uuid_local_key" ON "execucoes_tarefa"("uuid_local");

-- CreateIndex
CREATE INDEX "execucoes_tarefa_tarefa_id_idx" ON "execucoes_tarefa"("tarefa_id");

-- CreateIndex
CREATE INDEX "execucoes_tarefa_uuid_local_idx" ON "execucoes_tarefa"("uuid_local");

-- CreateIndex
CREATE INDEX "checklist_itens_tarefa_id_idx" ON "checklist_itens"("tarefa_id");

-- CreateIndex
CREATE INDEX "checklist_itens_concluido_idx" ON "checklist_itens"("concluido");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_uuid_local_key" ON "evidencias"("uuid_local");

-- CreateIndex
CREATE INDEX "evidencias_execucao_id_idx" ON "evidencias"("execucao_id");

-- CreateIndex
CREATE INDEX "evidencias_uuid_local_idx" ON "evidencias"("uuid_local");

-- CreateIndex
CREATE INDEX "evidencias_etapa_idx" ON "evidencias"("etapa");

-- CreateIndex
CREATE INDEX "log_auditoria_user_id_idx" ON "log_auditoria"("user_id");

-- CreateIndex
CREATE INDEX "log_auditoria_tabela_afetada_idx" ON "log_auditoria"("tabela_afetada");

-- CreateIndex
CREATE INDEX "log_auditoria_data_hora_idx" ON "log_auditoria"("data_hora");

-- CreateIndex
CREATE INDEX "nao_conformidades_execucao_id_idx" ON "nao_conformidades"("execucao_id");

-- CreateIndex
CREATE INDEX "nao_conformidades_supervisor_id_idx" ON "nao_conformidades"("supervisor_id");

-- CreateIndex
CREATE INDEX "nao_conformidades_status_correcao_idx" ON "nao_conformidades"("status_correcao");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_tarefa" ADD CONSTRAINT "execucoes_tarefa_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_itens" ADD CONSTRAINT "checklist_itens_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "execucoes_tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nao_conformidades" ADD CONSTRAINT "nao_conformidades_execucao_id_fkey" FOREIGN KEY ("execucao_id") REFERENCES "execucoes_tarefa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nao_conformidades" ADD CONSTRAINT "nao_conformidades_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
