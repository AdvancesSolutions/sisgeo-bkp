# Deploy SISGEO Frontend to AWS Amplify

$AWS_ACCOUNT = "320674390105"
$AWS_REGION = "sa-east-1"
$BUILD_DIR = "apps/web/dist"

if (!(Test-Path $BUILD_DIR)) {
    Write-Host "ERROR: Frontend build not found at $BUILD_DIR"
    Write-Host "Run: npm run build in the web app"
    exit 1
}

Write-Host "===== AWS Amplify Frontend Deployment ====="
Write-Host "Source: $BUILD_DIR"
Write-Host "Region: $AWS_REGION"
Write-Host ""

# Create S3 bucket
$BUCKET_NAME = "sigeo-frontend-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "Creating S3 bucket: $BUCKET_NAME..."
aws s3 mb "s3://$BUCKET_NAME" --region $AWS_REGION

# Enable static website hosting
Write-Host "Enabling static website hosting..."
$WEBSITE_CONFIG = @'
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
'@
$WEBSITE_CONFIG | Out-File website.json
aws s3api put-bucket-website --bucket $BUCKET_NAME --website-configuration "file://website.json" --region $AWS_REGION
Remove-Item website.json

# Upload files
Write-Host "Uploading frontend files..."
aws s3 sync $BUILD_DIR "s3://$BUCKET_NAME/" --region $AWS_REGION --delete

# Get CloudFront domain
Write-Host "Setting up CloudFront..."
$DIST_CONFIG = @'
{
  "CallerReference": "TIMESTAMP",
  "Comment": "SISGEO Frontend",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "BUCKET_NAME.s3.REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "MinTTL": 0
  }
}
'@

$DIST_CONFIG = $DIST_CONFIG -replace "TIMESTAMP", (Get-Date -Format 'o')
$DIST_CONFIG = $DIST_CONFIG -replace "BUCKET_NAME", $BUCKET_NAME
$DIST_CONFIG = $DIST_CONFIG -replace "REGION", $AWS_REGION

$DIST_CONFIG | Out-File dist-config.json
$CF_DIST = aws cloudfront create-distribution --distribution-config "file://dist-config.json" --region $AWS_REGION --output json | ConvertFrom-Json
Remove-Item dist-config.json

Write-Host ""
Write-Host "===== Deployment Complete ====="
Write-Host "S3 Bucket: $BUCKET_NAME"
Write-Host "CloudFront Domain: $($CF_DIST.Distribution.DomainName)"
Write-Host ""
Write-Host "Frontend URL: https://$($CF_DIST.Distribution.DomainName)"
Write-Host "API URL: http://56.125.14.85:3001"
