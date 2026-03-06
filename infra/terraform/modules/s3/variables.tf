variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "bucket_name" {
  type        = string
  default     = null
  description = "Nome exato do bucket (ex: sistema-limpeza-evidencias). Se null, usa project-env-evidencia."
}
