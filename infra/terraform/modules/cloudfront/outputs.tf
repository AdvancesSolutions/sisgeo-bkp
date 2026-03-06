output "distribution_id" {
  value = aws_cloudfront_distribution.evidencias.id
}

output "domain_name" {
  value = aws_cloudfront_distribution.evidencias.domain_name
}

output "url" {
  value = "https://${aws_cloudfront_distribution.evidencias.domain_name}"
}

output "origin_access_identity_iam_arn" {
  value = aws_cloudfront_origin_access_identity.s3.iam_arn
}
