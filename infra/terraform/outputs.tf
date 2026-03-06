output "rds_endpoint" {
  description = "Endpoint do RDS PostgreSQL"
  value       = module.rds.db_instance_endpoint
}

output "rds_database_name" {
  description = "Nome do banco de dados"
  value       = module.rds.db_instance_name
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 de evidências"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN do bucket S3"
  value       = module.s3.bucket_arn
}

output "ecs_cluster_name" {
  description = "Nome do cluster ECS"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Nome do serviço ECS"
  value       = module.ecs.service_name
}

output "alb_dns_name" {
  description = "DNS do Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID do ALB (para Route53)"
  value       = module.alb.alb_zone_id
}

output "api_url" {
  description = "URL da API (HTTP ou HTTPS conforme config)"
  value       = var.enable_https ? "https://${var.domain_name}" : "http://${module.alb.alb_dns_name}"
}

output "ecr_repository_url" {
  description = "URL do repositório ECR"
  value       = module.ecs.ecr_repository_url
}

output "ecs_task_role_arn" {
  description = "ARN da IAM role da task ECS (para S3)"
  value       = module.iam.ecs_task_role_arn
}

output "cloudfront_domain" {
  description = "Domínio CloudFront para evidências (CDN)"
  value       = module.cloudfront.domain_name
}

output "cloudfront_url" {
  description = "URL base CloudFront para evidências"
  value       = module.cloudfront.url
}
