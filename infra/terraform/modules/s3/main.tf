locals {
  bucket_name = (var.bucket_name != null && var.bucket_name != "") ? var.bucket_name : "${var.project_name}-${var.environment}-evidencias"
}

resource "aws_s3_bucket" "evidencias" {
  bucket = local.bucket_name

  tags = {
    Name = local.bucket_name
  }
}

resource "aws_s3_bucket_versioning" "evidencias" {
  bucket = aws_s3_bucket.evidencias.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidencias" {
  bucket = aws_s3_bucket.evidencias.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "evidencias" {
  bucket = aws_s3_bucket.evidencias.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets  = true
}

resource "aws_s3_bucket_lifecycle_configuration" "evidencias" {
  bucket = aws_s3_bucket.evidencias.id

  rule {
    id     = "transition-logs"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "cleanup-incomplete"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
