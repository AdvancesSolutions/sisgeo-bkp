terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Backend S3 (descomente após criar o bucket)
  # backend "s3" {
  #   bucket = "sigeo-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "sa-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# SSM Parameters
resource "aws_ssm_parameter" "db_password" {
  count = var.create_ssm_parameters ? 1 : 0
  name  = "/${var.project_name}/db-password"
  type  = "SecureString"
  value = var.db_password
}

resource "aws_ssm_parameter" "jwt_secret" {
  count = var.create_ssm_parameters ? 1 : 0
  name  = "/${var.project_name}/jwt-secret"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "jwt_refresh_secret" {
  count = var.create_ssm_parameters ? 1 : 0
  name  = "/${var.project_name}/jwt-refresh-secret"
  type  = "SecureString"
  value = var.jwt_refresh_secret
}

data "aws_ssm_parameter" "db_password" {
  count = var.create_ssm_parameters ? 0 : 1
  name  = "/${var.project_name}/db-password"
}

data "aws_ssm_parameter" "jwt_secret" {
  count = var.create_ssm_parameters ? 0 : 1
  name  = "/${var.project_name}/jwt-secret"
}

data "aws_ssm_parameter" "jwt_refresh_secret" {
  count = var.create_ssm_parameters ? 0 : 1
  name  = "/${var.project_name}/jwt-refresh-secret"
}

data "aws_caller_identity" "current" {}

locals {
  db_password_ssm_arn = var.create_ssm_parameters ? aws_ssm_parameter.db_password[0].arn : data.aws_ssm_parameter.db_password[0].arn
  jwt_secret_ssm_arn  = var.create_ssm_parameters ? aws_ssm_parameter.jwt_secret[0].arn : data.aws_ssm_parameter.jwt_secret[0].arn
  jwt_refresh_ssm_arn = var.create_ssm_parameters ? aws_ssm_parameter.jwt_refresh_secret[0].arn : data.aws_ssm_parameter.jwt_refresh_secret[0].arn
}

# ACM Certificate (opcional, para HTTPS)
data "aws_acm_certificate" "domain" {
  count    = var.enable_https && var.domain_name != "" ? 1 : 0
  domain   = var.domain_name
  statuses = ["ISSUED"]
}

# --- Módulos ---

module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
  bucket_name  = var.s3_bucket_name != "" ? var.s3_bucket_name : null
}

module "cloudfront" {
  source = "./modules/cloudfront"

  project_name                    = var.project_name
  environment                     = var.environment
  s3_bucket_id                    = module.s3.bucket_name
  s3_bucket_regional_domain_name  = module.s3.bucket_regional_domain_name
  s3_bucket_arn                   = module.s3.bucket_arn
  price_class                     = var.cloudfront_price_class
}

module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.enable_https && var.domain_name != "" ? data.aws_acm_certificate.domain[0].arn : ""
}

module "security" {
  source = "./modules/security"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  alb_security_group_id  = module.alb.alb_security_group_id
}

module "iam" {
  source = "./modules/iam"

  project_name  = var.project_name
  environment   = var.environment
  s3_bucket_arn = module.s3.bucket_arn
}

module "rds" {
  source = "./modules/rds"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  ecs_security_group_id = module.security.ecs_security_group_id
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  database_name         = var.db_name
  username              = var.db_username
  password              = var.db_password
}

# S3 bucket policy: permite CloudFront OAI ler objetos
data "aws_iam_policy_document" "s3_cloudfront" {
  statement {
    sid    = "AllowCloudFrontOAI"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [module.cloudfront.origin_access_identity_iam_arn]
    }
    actions   = ["s3:GetObject"]
    resources = ["${module.s3.bucket_arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "evidencias_cloudfront" {
  bucket = module.s3.bucket_name

  policy = data.aws_iam_policy_document.s3_cloudfront.json
}

module "ecs" {
  source = "./modules/ecs"

  project_name                = var.project_name
  environment                 = var.environment
  vpc_id                      = module.vpc.vpc_id
  private_subnet_ids          = module.vpc.private_subnet_ids
  ecs_security_group_id      = module.security.ecs_security_group_id
  target_group_arn           = module.alb.target_group_arn
  execution_role_arn         = module.iam.ecs_execution_role_arn
  task_role_arn              = module.iam.ecs_task_role_arn
  repository_name            = var.ecr_repository_name
  cpu                        = var.ecs_cpu
  memory                     = var.ecs_memory
  db_host                    = module.rds.db_instance_address
  db_username                = var.db_username
  db_name                    = var.db_name
  db_password_ssm_arn        = local.db_password_ssm_arn
  jwt_secret_ssm_arn         = local.jwt_secret_ssm_arn
  jwt_refresh_secret_ssm_arn = local.jwt_refresh_ssm_arn
  s3_bucket_name             = module.s3.bucket_name
  aws_region                 = var.aws_region
  cors_origin                = var.cors_origin
  cloudfront_url             = "https://${module.cloudfront.domain_name}"
}
