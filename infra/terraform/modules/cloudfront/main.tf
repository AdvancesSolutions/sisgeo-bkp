# CloudFront CDN para carregamento rápido de fotos no mobile
# Origin: S3 bucket de evidências

resource "aws_cloudfront_origin_access_identity" "s3" {
  comment = "${var.project_name}-${var.environment} S3 OAI"
}

resource "aws_cloudfront_distribution" "evidencias" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN para evidências SGO"
  default_root_object = ""
  price_class         = var.price_class

  origin {
    domain_name = var.s3_bucket_regional_domain_name
    origin_id   = "S3-${var.s3_bucket_id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.s3.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.s3_bucket_id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    default_ttl = 86400
    max_ttl     = 31536000
    min_ttl     = 0

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-evidencias-cdn"
  }
}
