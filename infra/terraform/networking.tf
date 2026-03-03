# ============================================================================
# VPC — Minimal cost-optimized network
# ============================================================================
# Uses default VPC with public subnets to avoid NAT Gateway costs ($32/mo).
# App Runner has its own managed networking.
# For production with stricter security, add private subnets + NAT.
# ============================================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security group for RDS
resource "aws_security_group" "database" {
  name_prefix = "anvix-db-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "anvix-database" }
}

# Security group for Redis
resource "aws_security_group" "redis" {
  name_prefix = "anvix-redis-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Redis from VPC"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "anvix-redis" }
}

# App Runner VPC Connector (so API can reach RDS/Redis)
resource "aws_apprunner_vpc_connector" "api" {
  vpc_connector_name = "anvix-api-connector"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.database.id, aws_security_group.redis.id]
}
