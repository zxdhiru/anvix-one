# ============================================================================
# ElastiCache Redis — Cost Optimized
# ============================================================================
# cache.t4g.micro: cheapest option (~$12/mo)
# Single node (no replication) for cost savings
# ============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "anvix-redis-subnet"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "anvix-redis"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  port                 = 6379
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  # Cost savings
  snapshot_retention_limit = 1
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_window          = "04:00-05:00"

  tags = { Name = "anvix-redis" }
}
