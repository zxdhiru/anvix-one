# ============================================================================
# Outputs
# ============================================================================

output "ecr_repository_url" {
  description = "ECR repository URL for API"
  value       = aws_ecr_repository.api.repository_url
}

output "apprunner_service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.api.service_url
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = "${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
  sensitive   = true
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (set as AWS_DEPLOY_ROLE_ARN secret)"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "apprunner_ecr_role_arn" {
  description = "IAM role ARN for App Runner ECR access (set as APP_RUNNER_ECR_ROLE_ARN secret)"
  value       = aws_iam_role.apprunner_ecr.arn
}
