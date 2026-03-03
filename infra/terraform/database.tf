# ============================================================================
# RDS PostgreSQL — Cost Optimized
# ============================================================================
# db.t4g.micro: 2 vCPU, 1 GB RAM — free tier eligible for 12 months
# Single-AZ to save costs (add Multi-AZ for production HA)
# ============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "anvix-db-subnet"
  subnet_ids = data.aws_subnets.default.ids

  tags = { Name = "anvix-db-subnet" }
}

resource "aws_db_instance" "postgres" {
  identifier = "anvix-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "17"
  instance_class       = "db.t4g.micro"
  
  # Storage — start small, auto-scale
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  # Credentials
  db_name  = "anvix_platform"
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false

  # Cost savings
  multi_az               = false
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "anvix-postgres-final"

  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Performance Insights (free tier)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = { Name = "anvix-postgres" }
}
