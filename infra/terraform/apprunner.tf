# ============================================================================
# App Runner — API Service (Cost Optimized)
# ============================================================================
# - 0.25 vCPU / 0.5 GB RAM (smallest instance)
# - Auto-scales 1→5 based on traffic
# - Built-in HTTPS, load balancing, health checks
# - ~$5-15/mo at low traffic
# ============================================================================

# IAM role for App Runner to pull from ECR
resource "aws_iam_role" "apprunner_ecr" {
  name = "anvix-apprunner-ecr-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_ecr.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# IAM role for App Runner instance (runtime)
resource "aws_iam_role" "apprunner_instance" {
  name = "anvix-apprunner-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

# App Runner auto-scaling configuration
resource "aws_apprunner_auto_scaling_configuration_version" "api" {
  auto_scaling_configuration_name = "anvix-api-scaling"

  max_concurrency = 100
  max_size        = 5
  min_size        = 1

  tags = { Name = "anvix-api-scaling" }
}

# App Runner service
resource "aws_apprunner_service" "api" {
  service_name = "anvix-api"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.api.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "4000"

        runtime_environment_variables = merge(
          {
            NODE_ENV     = "production"
            PORT         = "4000"
            DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
            REDIS_URL    = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
          },
          var.api_env_vars
        )
      }
    }
  }

  instance_configuration {
    cpu               = "0.25 vCPU"
    memory            = "0.5 GB"
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.api.arn

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.api.arn
    }
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = { Name = "anvix-api" }
}
