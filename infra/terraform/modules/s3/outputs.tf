output "bucket_name" {
  value = aws_s3_bucket.evidencias.id
}

output "bucket_arn" {
  value = aws_s3_bucket.evidencias.arn
}

output "bucket_regional_domain_name" {
  value = aws_s3_bucket.evidencias.bucket_regional_domain_name
}
