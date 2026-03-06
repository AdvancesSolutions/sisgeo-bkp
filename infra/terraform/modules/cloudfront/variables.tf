variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "s3_bucket_id" {
  description = "ID do bucket S3 de evidências"
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name do bucket S3"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN do bucket S3 (para policy)"
  type        = string
}

variable "price_class" {
  description = "Price class do CloudFront (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_100"
}
