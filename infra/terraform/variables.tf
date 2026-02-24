variable "project_name" {
  description = "Nome do projeto (prefixo para recursos)"
  type        = string
  default     = "sigeo"
}

variable "environment" {
  description = "Ambiente (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "sa-east-1"
}

variable "db_instance_class" {
  description = "Classe da instância RDS (t3.micro, t3.small)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Storage alocado para RDS (GB)"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Nome do banco de dados"
  type        = string
  default     = "sigeo"
}

variable "db_username" {
  description = "Usuário master do RDS"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Senha master do RDS"
  type        = string
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "Nome do bucket S3 para evidências"
  type        = string
  default     = "sistema-limpeza-evidencias"
}

variable "domain_name" {
  description = "Domínio para certificado ACM (ex: sigeo.advances.com.br)"
  type        = string
  default     = ""
}

variable "ecr_repository_name" {
  description = "Nome do repositório ECR para a API"
  type        = string
  default     = "sigeo-api"
}

variable "ecs_cpu" {
  description = "CPU para task ECS (256, 512)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Memória para task ECS (MB)"
  type        = number
  default     = 512
}

variable "vpc_cidr" {
  description = "CIDR da VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_https" {
  description = "Habilitar ALB com HTTPS (requer domain_name e certificado ACM)"
  type        = bool
  default     = false
}

variable "create_ssm_parameters" {
  description = "Criar parâmetros SSM (db-password, jwt-secret). Use false se já existirem."
  type        = bool
  default     = true
}

variable "jwt_secret" {
  description = "Secret para JWT (usado se create_ssm_parameters=true)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_refresh_secret" {
  description = "Secret para JWT refresh (usado se create_ssm_parameters=true)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cors_origin" {
  description = "Origem CORS permitida (ex: https://sigeo.advances.com.br)"
  type        = string
  default     = "*"
}

variable "cloudfront_price_class" {
  description = "Price class do CloudFront (PriceClass_100 = mais barato, PriceClass_All = global)"
  type        = string
  default     = "PriceClass_100"
}
