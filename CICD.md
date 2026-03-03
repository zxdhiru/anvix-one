# Anvix One — CI/CD Setup Guide

## Architecture Overview

```
┌──────────────┐     ┌─────────────────────────────────────────────────┐
│   GitHub      │     │  On Push to main                               │
│   Repository  │────▶│                                                 │
│               │     │  ┌──────────────┐   ┌────────────────────────┐ │
│               │     │  │  CI Pipeline  │   │  CD — API              │ │
│               │     │  │  (All PRs)    │   │  (apps/api changed)    │ │
│               │     │  │              │   │                        │ │
│               │     │  │  • Lint      │   │  Docker Build          │ │
│               │     │  │  • Type Check│   │       ↓                │ │
│               │     │  │  • Test      │   │  Push to ECR           │ │
│               │     │  │  • Build     │   │       ↓                │ │
│               │     │  └──────────────┘   │  Deploy App Runner     │ │
│               │     │                      │       ↓                │ │
│               │     │                      │  Run DB Migrations     │ │
│               │     │                      └────────────────────────┘ │
│               │     └─────────────────────────────────────────────────┘
│               │
│               │     ┌─────────────────────────────────────────────────┐
│               │────▶│  Vercel (automatic on push)                     │
│               │     │                                                 │
│               │     │  • web-admin     → admin.anvix.com              │
│               │     │  • web-school    → app.anvix.com                │
│               │     │  • web-marketing → anvix.com                    │
│               │     │                                                 │
│               │     │  turbo-ignore skips unchanged apps              │
│               │     └─────────────────────────────────────────────────┘
```

## Cost Breakdown (Estimated Monthly)

| Service            | Resource                   | Cost           |
| ------------------ | -------------------------- | -------------- |
| **Vercel**         | 3 Next.js apps (Hobby/Pro) | Free – $20/mo  |
| **App Runner**     | 0.25 vCPU / 0.5 GB         | ~$5–15/mo      |
| **RDS PostgreSQL** | db.t4g.micro               | ~$13/mo\*      |
| **ElastiCache**    | cache.t4g.micro            | ~$12/mo        |
| **ECR**            | Container images           | ~$1/mo         |
| **GitHub Actions** | CI minutes                 | Free tier      |
| **Total**          |                            | **~$30–60/mo** |

\* Free tier eligible for first 12 months

---

## Setup Instructions

### Prerequisites

- AWS account with billing enabled
- GitHub repository
- Vercel account
- Terraform installed locally (`>= 1.5`)
- AWS CLI configured

---

### 1. Vercel — Frontend Deployments

Each frontend is a **separate Vercel project** pointing to the same monorepo.

#### For each app (`web-admin`, `web-school`, `web-marketing`):

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `anvix-one` repository
3. Set **Root Directory** to `apps/web-admin` (or `web-school`, `web-marketing`)
4. Vercel auto-detects `vercel.json` — no further build config needed
5. Set environment variables:
   - `NEXT_PUBLIC_API_URL` → your App Runner URL (set after AWS deploy)

The `vercel.json` in each app uses `turbo-ignore` to skip builds when only other apps changed — saving build minutes.

#### Custom Domains (recommended):

- `web-marketing` → `anvix.com`
- `web-admin` → `admin.anvix.com`
- `web-school` → `app.anvix.com`

---

### 2. AWS Infrastructure — Terraform

#### a. Create the Terraform state backend (one-time):

```bash
aws s3 mb s3://anvix-terraform-state --region ap-south-1
aws dynamodb create-table \
  --table-name anvix-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

#### b. Configure variables:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

#### c. Deploy infrastructure:

```bash
terraform init
terraform plan
terraform apply
```

#### d. Save the outputs — you'll need them for GitHub secrets:

```bash
terraform output -json
```

---

### 3. GitHub — Repository Secrets & Variables

Go to **Settings → Secrets and variables → Actions** and add:

#### Secrets:

| Name                      | Value                             | Source             |
| ------------------------- | --------------------------------- | ------------------ |
| `AWS_DEPLOY_ROLE_ARN`     | `arn:aws:iam::123:role/anvix-...` | `terraform output` |
| `APP_RUNNER_ECR_ROLE_ARN` | `arn:aws:iam::123:role/anvix-...` | `terraform output` |
| `DATABASE_URL`            | `postgresql://user:pass@host/db`  | `terraform output` |

#### Variables:

| Name         | Value                                      |
| ------------ | ------------------------------------------ |
| `TURBO_TEAM` | Your Vercel team slug (for remote caching) |

#### Secrets (optional, for Turbo remote cache):

| Name          | Value               |
| ------------- | ------------------- |
| `TURBO_TOKEN` | Vercel access token |

---

### 4. Turbo Remote Cache (Optional but Recommended)

Dramatically speeds up CI by caching build artifacts across runs.

```bash
npx turbo login
npx turbo link
```

This generates the `TURBO_TOKEN` and `TURBO_TEAM` values for GitHub secrets.

---

### 5. GitHub Environments (Optional)

Create `staging` and `production` environments under **Settings → Environments**:

- Add required reviewers for `production`
- Set environment-specific secrets (different `DATABASE_URL`, etc.)

---

## Pipeline Behavior

### On Pull Request:

1. **Detect changes** — path-based filtering identifies affected apps
2. **Quality checks** — lint, type-check, test (only affected packages)
3. **Build verification** — build only changed apps
4. Vercel creates **preview deployments** automatically

### On Push to `main`:

1. Same CI checks run
2. **API deployment** (if `apps/api/**` changed):
   - Build Docker image
   - Push to ECR (with layer caching)
   - Update App Runner service
   - Run database migrations
3. **Vercel auto-deploys** frontends (skips unchanged apps via `turbo-ignore`)

### Cost Optimizations Applied:

- **Path-based filtering** — CI jobs only run for changed apps
- **Concurrency groups** — cancel duplicate runs on same branch
- **Docker layer caching** — `cache-from: type=gha` reuses layers
- **Turbo remote caching** — skip already-built packages
- **App Runner** — scales to min 1 instance, no idle EC2
- **ECR lifecycle policy** — auto-delete old images (keep 10)
- **RDS t4g.micro** — free tier eligible, gp3 storage
- **OIDC auth** — no long-lived IAM access keys
- **Vercel `turbo-ignore`** — skip unnecessary frontend builds

---

## Files Created

```
.github/workflows/
├── ci.yml                # PR checks — lint, type-check, test, build
└── deploy-api.yml        # CD — build Docker → ECR → App Runner

apps/web-admin/vercel.json    # Vercel monorepo config
apps/web-school/vercel.json   # Vercel monorepo config
apps/web-marketing/vercel.json# Vercel monorepo config

docker/Dockerfile.api         # Optimized multi-stage build

.dockerignore                 # Reduce Docker build context

infra/terraform/
├── main.tf              # Provider + backend config
├── variables.tf         # Input variables
├── networking.tf        # VPC, security groups, VPC connector
├── ecr.tf               # Container registry + lifecycle
├── database.tf          # RDS PostgreSQL (t4g.micro)
├── redis.tf             # ElastiCache Redis (t4g.micro)
├── apprunner.tf         # App Runner service + auto-scaling
├── oidc.tf              # GitHub OIDC provider + IAM roles
├── outputs.tf           # Exported values
└── terraform.tfvars.example
```
