# ============================================================================
# Anvix One — AWS Infrastructure (Terraform)
# ============================================================================
# Cost-optimized setup:
#   - App Runner for API (auto-scales, no idle EC2)
#   - RDS PostgreSQL db.t4g.micro (free tier eligible)
#   - ElastiCache Redis t4g.micro (cheapest option)
#   - ECR for container images
#   - OIDC for GitHub Actions (no IAM keys)
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store state in S3 (create this bucket manually first)
  backend "s3" {
    bucket         = "anvix-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "anvix-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "anvix-one"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
