# Plan: Anvix One — Complete Multi-Tenant School Management System for India

## TL;DR

Build **Anvix One**, a paperless multi-tenant school management SaaS for Indian schools (CBSE + State Boards), as a **solo developer** using a **NestJS modular monolith** with **Neon PostgreSQL** (schema-per-tenant), hosted on **AWS Lightsail Mumbai**. The system consists of **5 frontend apps + 1 backend API** organized in a **Turborepo monorepo with npm**. Phased delivery across **32 weeks**, launching web-only first, targeting ₹500–5,000/mo per school.

---

## Application Architecture — What We're Building

### Backend: 1 NestJS Modular Monolith (2 logical systems)

| Module Group        | Domain                                               | Exposed As                   |
| ------------------- | ---------------------------------------------------- | ---------------------------- |
| **Platform System** | Tenants, plans, billing, subscriptions, provisioning | REST API (`/api/platform/*`) |
| **School System**   | Students, teachers, attendance, fees, exams, etc.    | REST API (`/api/school/*`)   |

> Single NestJS app, split by NestJS modules with strict module boundaries. Deployed as one process. Split into microservices only at 200+ tenants.

### Frontend: 5 Next.js Applications

| #   | App                          | Users                     | Route Strategy                       |
| --- | ---------------------------- | ------------------------- | ------------------------------------ |
| 1   | **Marketing Website**        | Prospective schools       | `anvixone.in` (SSG/SSR)              |
| 2   | **Platform Admin Dashboard** | You (platform owner)      | `admin.anvixone.in` (CSR)            |
| 3   | **School Admin Dashboard**   | School admins, principals | `{school}.anvixone.in` (CSR)         |
| 4   | **Teacher Portal**           | Teachers                  | `{school}.anvixone.in/teacher` (CSR) |
| 5   | **Parent/Student Portal**    | Parents, students         | `{school}.anvixone.in/parent` (CSR)  |

> Apps 3, 4, 5 are **one Next.js app** with role-based routing (3 logical apps, 1 deployable). This reduces deployment to **3 deployable frontend apps**.

### Shared Packages (Monorepo)

| Package             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `@anvix/ui`         | Shared design system (shadcn/ui + Tailwind)               |
| `@anvix/types`      | Shared TypeScript types & API contracts                   |
| `@anvix/utils`      | Common utilities (date formatting, Indian currency, etc.) |
| `@anvix/validators` | Shared Zod schemas for forms & API validation             |
| `@anvix/config`     | Shared ESLint, TypeScript, Tailwind configs               |

### Final Count

| Type                  | Count                        | Deployables             |
| --------------------- | ---------------------------- | ----------------------- |
| Backend apps          | 1 (modular monolith)         | 1                       |
| Frontend apps         | 5 (logical) / 3 (deployable) | 3                       |
| Shared packages       | 5                            | 0 (consumed internally) |
| **Total deployables** | —                            | **4**                   |

---

## Monorepo Structure

```text
anvix-one/
├── apps/
│   ├── api/                    # NestJS backend (Platform + School modules)
│   ├── web-marketing/          # Marketing site (Next.js SSG)
│   ├── web-admin/              # Platform admin dashboard (Next.js)
│   └── web-school/             # School dashboard — admin/teacher/parent (Next.js)
├── packages/
│   ├── ui/                     # Shared component library
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   ├── validators/             # Shared Zod schemas
│   └── config/                 # Shared configs (eslint, tsconfig, tailwind)
├── docker/
│   ├── docker-compose.yml      # Local dev environment
│   └── Dockerfile.api          # Backend Dockerfile
├── turbo.json
├── package.json
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
└── docs/                       # Architecture decisions, API docs
```

---

## Complete Tech Stack (Final)

| Layer                | Technology                           | Cost                         |
| -------------------- | ------------------------------------ | ---------------------------- |
| **Monorepo**         | Turborepo + npm                      | $0                           |
| **Backend**          | NestJS + TypeScript                  | $0                           |
| **Frontend**         | Next.js 15 + React 19                | $0                           |
| **UI**               | shadcn/ui + Tailwind CSS v4 + Radix  | $0                           |
| **ORM**              | Drizzle ORM                          | $0                           |
| **Validation**       | Zod (shared frontend + backend)      | $0                           |
| **Database**         | Neon PostgreSQL (Singapore)          | $0 (free tier)               |
| **Cache**            | Upstash Redis                        | $0 (free tier)               |
| **Auth**             | Better Auth (self-hosted, phone OTP) | $0                           |
| **OTP/SMS**          | MSG91                                | ~₹0.15/SMS                   |
| **WhatsApp**         | Interakt (free tier → paid)          | $0 initially                 |
| **Email**            | Resend                               | $0 (free tier)               |
| **Payments**         | Razorpay (subscriptions + UPI)       | 2% per txn                   |
| **Frontend Hosting** | Vercel (free tier)                   | $0                           |
| **Backend Hosting**  | AWS Lightsail Mumbai                 | $5/mo                        |
| **CDN**              | Cloudflare                           | $0                           |
| **CI/CD**            | GitHub Actions                       | $0                           |
| **Monitoring**       | Betterstack + Sentry                 | $0                           |
| **i18n**             | next-intl (English + Hindi)          | $0                           |
| **File Storage**     | Cloudflare R2                        | 10GB free, no egress charges |
| **PDF Generation**   | `@react-pdf/renderer`                | $0                           |

**Estimated Monthly: ₹800–1,200/mo (~$10–15) at seed stage**

---

## Development Phases (32 Weeks — Solo Developer)

---

### Phase 0 — Foundation & Scaffolding (Weeks 1–3)

**Goal:** Fully working monorepo with all apps running locally, CI/CD deploying, zero features.

**Steps:**

1. Initialize Turborepo monorepo with npm workspaces
2. Scaffold NestJS backend (`apps/api`) with modular structure:
   - `src/platform/` — Platform System modules
   - `src/school/` — School System modules
   - `src/common/` — Guards, interceptors, filters, decorators
3. Scaffold 3 Next.js apps (`web-marketing`, `web-admin`, `web-school`)
4. Create all 5 shared packages (`@anvix/ui`, `@anvix/types`, `@anvix/utils`, `@anvix/validators`, `@anvix/config`)
5. Set up Docker Compose: NestJS API + PostgreSQL + Redis + MailHog
6. Set up Drizzle ORM with migration framework, schema-per-tenant utility functions
7. Configure Better Auth with phone OTP + Google OAuth
8. Set up GitHub Actions: lint → type-check → test → build → deploy
9. Configure Vercel (3 frontend apps) + AWS Lightsail Mumbai (API)
10. Set up Cloudflare for DNS + CDN
11. Seed `@anvix/ui` with base components: Button, Input, Card, Table, Modal, Form, Sidebar, Navbar, Badge
12. Set up i18n skeleton (English + Hindi) in `web-school`

**Verification:**

- `npm run dev` from root starts all 4 apps
- `docker compose up` starts full local environment
- GitHub Actions green on push
- All apps accessible on Vercel preview URLs
- API deployed on Lightsail and responding

---

### Phase 1 — Platform Core: Tenant Onboarding (Weeks 4–7)

**Goal:** A school can sign up, choose a plan, pay via Razorpay, and get a provisioned tenant.

**Steps:**

1. **Plan Management** (Platform Module)
   - CRUD for subscription plans (Basic, Standard, Premium)
   - Plan features matrix (max students, SMS quota, modules enabled)
   - Drizzle schema: `plans`, `plan_features`

2. **Tenant Registration Flow**
   - School registration form: school name, board (CBSE/State), principal phone, email
   - Subdomain reservation (`{school-slug}.anvixone.in`)
   - Drizzle schema: `tenants`, `tenant_subscriptions`

3. **Razorpay Subscription Integration**
   - Create Razorpay subscription on plan selection
   - Handle payment success/failure webhooks
   - Subscription status tracking: `active`, `past_due`, `suspended`, `cancelled`
   - UPI autopay + card recurring support

4. **Tenant Provisioning Pipeline**
   - On successful payment → create PostgreSQL schema for tenant
   - Run tenant-specific migrations within new schema
   - Create school admin user (phone OTP verified)
   - Send WhatsApp/SMS welcome message
   - Atomic: if any step fails, rollback everything

5. **Platform Admin Dashboard** (`web-admin`)
   - Login (your account only, email + password)
   - Dashboard: total tenants, MRR, active/suspended counts
   - Tenant list with status, plan, created date
   - Manual tenant actions: suspend, reactivate, delete
   - Plan management UI

6. **Subscription Validation Middleware**
   - Redis cache for tenant status (10-min TTL)
   - Webhook-driven cache invalidation on suspension
   - Every School System request passes through this guard

**Verification:**

- Complete signup flow: register → select plan → pay via Razorpay → tenant provisioned
- Platform admin can see new tenant, suspend it, verify school portal becomes blocked
- Razorpay webhook handles payment failures correctly

---

### Phase 2 — School Core: User & Academic Setup (Weeks 8–12)

**Goal:** A provisioned school can log in, set up academic year, manage users and students.

**Steps:**

1. **School Admin Onboarding**
   - First login via phone OTP → set up school profile
   - School profile: name, address, logo, UDISE+ code, board affiliation
   - Academic year setup (April–March cycle)
   - Term/semester configuration

2. **User Management**
   - Roles: School Admin, Vice Principal, Teacher, Accountant, Staff
   - Invite via phone number → OTP verification
   - Role-based access control (RBAC) using NestJS guards
   - Drizzle schemas: `users`, `roles`, `permissions`, `user_roles`

3. **Class & Section Management**
   - Classes: Nursery, LKG, UKG, 1–12
   - Sections: A, B, C, D per class
   - Subject assignment per class (board-specific defaults for CBSE, State)
   - Class teacher assignment
   - Drizzle schemas: `classes`, `sections`, `subjects`, `class_subjects`

4. **Student Management**
   - Student registration form (name, DOB, Aadhaar optional, parent info, address, blood group, category, religion)
   - Admission number auto-generation
   - Class/section assignment
   - Student promotion/transfer
   - Bulk import via CSV/Excel upload
   - Drizzle schemas: `students`, `student_guardians`, `student_class_history`

5. **Teacher Management**
   - Teacher profile (qualifications, subjects, experience)
   - Subject-class assignment
   - Drizzle schemas: `teachers`, `teacher_subjects`

6. **Parent Portal Setup**
   - Parent auto-created when student is registered
   - Phone OTP login
   - Multiple children linked to one parent
   - Read-only access to child's data

7. **School Dashboard Shell** (`web-school`)
   - Role-based sidebar navigation
   - School admin view: overview stats, quick actions
   - Teacher view: my classes, my subjects
   - Parent view: my children, notifications

**Verification:**

- School admin logs in, sets up academic year, creates classes
- Bulk import 100 students via CSV
- Teacher logs in, sees assigned classes
- Parent logs in via phone OTP, sees child's profile

---

### Phase 3 — Attendance System: Going Paperless (Weeks 13–16)

**Goal:** Complete digital attendance replacing paper registers.

**Steps:**

1. **Student Attendance**
   - Daily attendance by class/section (teacher marks)
   - Status: Present, Absent, Late, Half-Day, Leave
   - Period-wise attendance (optional, for higher classes)
   - Drizzle schemas: `attendance`, `attendance_periods`

2. **Teacher/Staff Attendance**
   - Staff daily attendance (admin marks)
   - Leave request → approval workflow
   - Leave types: CL, EL, SL, Maternity (configurable)
   - Drizzle schemas: `staff_attendance`, `leave_requests`, `leave_types`, `leave_balances`

3. **Attendance Reports**
   - Daily attendance summary (class-wise, school-wide)
   - Monthly attendance register (replicates paper format digitally)
   - Student-wise attendance percentage
   - Auto-flag students below 75% attendance (CBSE requirement)

4. **Parent Notifications**
   - Auto SMS/WhatsApp to parent when child marked absent
   - Weekly attendance summary to parents (WhatsApp)

5. **Attendance Dashboard**
   - Real-time school-wide attendance percentage
   - Class-wise heatmap
   - Trend charts (weekly, monthly)

**Verification:**

- Teacher opens app → marks attendance for 40 students in under 2 minutes
- Parent receives WhatsApp within 5 minutes of child being marked absent
- Attendance report matches paper register format exactly
- 75% attendance auto-flagging works

---

### Phase 4 — Fee Management & Accounting (Weeks 17–21)

**Goal:** Complete fee collection system replacing paper receipts — the #1 pain point for Indian schools.

**Steps:**

1. **Fee Structure Configuration**
   - Fee heads: Tuition, Transport, Lab, Library, Sports, Exam, etc.
   - Fee plans per class (different amounts per class)
   - Term-wise breakup (Quarterly / Half-yearly / Annual)
   - Sibling discount rules
   - RTE/scholarship/waiver categorization
   - Drizzle schemas: `fee_heads`, `fee_structures`, `fee_plans`, `fee_discounts`

2. **Fee Assignment & Invoice Generation**
   - Auto-assign fees to students based on class + fee plan
   - Generate digital invoices per term
   - Invoice with school header, GSTIN (if applicable), fee breakup
   - Drizzle schemas: `student_fees`, `fee_invoices`, `invoice_items`

3. **Fee Collection (Razorpay per-tenant)**
   - Online payment via Razorpay (UPI, cards, net banking)
   - Payment link sent to parent via WhatsApp/SMS
   - Cash/cheque/DD recording (offline collection by school accountant)
   - Partial payment support
   - Auto digital receipt generation (PDF)
   - Drizzle schemas: `fee_payments`, `payment_receipts`

4. **Fee Reports & Accounting**
   - Daily collection report
   - Outstanding/defaulter list by class
   - Fee collection summary (monthly, term-wise, annual)
   - Export to Excel for school accountant
   - Receipt book (replaces physical receipt book)

5. **Fee Reminders**
   - Auto WhatsApp/SMS reminders before due date (7 days, 3 days, 1 day)
   - Overdue reminders (weekly until paid)
   - Bulk reminder to all defaulters

6. **Parent Fee Portal**
   - View fee breakup, pending amounts
   - Pay online via Razorpay
   - Download receipts (PDF)
   - Payment history

**Verification:**

- School creates fee structure → assigns to students → parent receives WhatsApp with payment link
- Parent pays via UPI → receipt auto-generated → school sees collection in real-time
- Defaulter report matches manual calculation
- PDF receipt has school logo, breakup, is printer-friendly

---

### Phase 5 — Examinations & Report Cards (Weeks 22–26)

**Goal:** Digital exam management and board-compliant report cards replacing paper mark sheets.

**Steps:**

1. **Exam Configuration**
   - Exam types: Unit Test, Mid-Term, Final, Board Pre-board
   - CBSE pattern: FA1/FA2/SA1/SA2 or Term 1/Term 2
   - State board patterns (configurable per board)
   - Grading system: CBSE 9-point scale + percentage + GPA (configurable)
   - Drizzle schemas: `exams`, `exam_schedules`, `grading_scales`

2. **Marks Entry**
   - Teacher enters marks per subject per exam
   - Bulk entry via spreadsheet-style UI
   - Marks validation (min/max, pass marks)
   - Co-scholastic grades (CBSE: Art, Work Ed, Physical Ed, Discipline)
   - Drizzle schemas: `exam_marks`, `co_scholastic_marks`

3. **Report Card Generation**
   - CBSE-compliant report card template
   - State board templates (configurable)
   - Auto-calculate: total, percentage, grade, rank
   - Class teacher remarks, principal signature placeholder
   - PDF generation using `@react-pdf/renderer`
   - Bulk generation for entire class

4. **Result Analysis**
   - Class toppers, subject toppers
   - Subject-wise pass/fail analysis
   - Comparison across sections
   - Teacher performance insight (subject-wise)
   - Trend: student progress across exams

5. **Parent/Student Portal**
   - View results exam-wise
   - Download report cards (PDF)
   - Progress graph across exams

6. **Exam Schedule & Timetable**
   - Create exam timetable per class
   - Share with parents via WhatsApp
   - Seat allocation (optional)

**Verification:**

- Teacher enters marks → report card auto-generated in CBSE format → matches physical report card exactly
- Parent views results, downloads PDF
- Grade calculation matches CBSE standards
- Bulk report card generation for 200 students completes in < 30 seconds

---

### Phase 6 — Communication & Paperless Notices (Weeks 27–28)

**Goal:** Replace paper circulars, notices, and diary entries with digital communication.

**Steps:**

1. **Notice Board / Circular System**
   - Create notices targeted to: entire school, specific class, specific section, individual parent
   - Attach files (PDF, images) stored on Cloudflare R2
   - Read receipts (track who opened)
   - Push via WhatsApp + in-app notification

2. **Digital Diary**
   - Teacher posts homework/assignments daily per subject
   - Parent views in portal
   - WhatsApp summary of daily homework

3. **Event Calendar**
   - School events, holidays, exam schedule
   - Auto-sync with academic calendar
   - Parent can see upcoming events

4. **Internal Messaging**
   - Parent ↔ Teacher messaging (in-app)
   - Admin can broadcast to all teachers

**Verification:**

- Admin publishes notice → all parents receive WhatsApp within 5 min
- Teacher posts homework → parent sees in portal + WhatsApp
- Read receipt shows 80%+ delivery rate

---

### Phase 7 — Marketing Website & Self-Service Launch (Weeks 29–30)

**Goal:** Public-facing marketing site with self-service school onboarding.

**Steps:**

1. **Marketing Website** (`web-marketing`)
   - Hero section: "Make your school 100% paperless"
   - Features showcase (attendance, fees, exams, communication)
   - Pricing table (₹500 / ₹1,500 / ₹5,000 tiers)
   - School testimonials / case studies (add post-launch)
   - Blog (SEO for "school management software India")
   - Hindi + English toggle
   - WhatsApp chat widget for inquiries

2. **Self-Service Onboarding Flow**
   - School registers → selects plan → pays via Razorpay → gets subdomain → starts setup
   - Guided onboarding wizard in school dashboard (7 steps):
     1. School profile
     2. Academic year & terms
     3. Classes & sections
     4. Add teachers
     5. Upload students (CSV)
     6. Configure fee structure
     7. Go live!

3. **Demo Environment**
   - Pre-filled demo tenant that prospects can explore
   - Accessible from marketing site without signup

**Verification:**

- Full self-service flow: landing page → signup → pay → school live in < 10 minutes
- Marketing site scores 90+ on Lighthouse (performance, SEO)
- Hindi version renders correctly

---

### Phase 8 — Hardening & Production Launch (Weeks 31–32)

**Goal:** Production-grade stability, security, and compliance.

**Steps:**

1. **Security Hardening**
   - Rate limiting on all APIs
   - OWASP top 10 check (SQL injection, XSS, CSRF)
   - Tenant isolation verification: no cross-tenant data leakage
   - Data encryption at rest (Neon default) and in transit (TLS)
   - Input sanitization on all user inputs

2. **Performance Optimization**
   - Database query optimization (indexes, explain analyze)
   - API response time < 200ms for 95th percentile
   - Frontend bundle analysis, lazy loading
   - Image optimization (school logos, student photos)

3. **Backup & Recovery**
   - Neon automatic point-in-time recovery
   - Daily export of critical tenant data
   - Disaster recovery procedure documented

4. **Monitoring & Alerting**
   - Sentry for error tracking
   - Betterstack for uptime monitoring
   - Alert on: API errors > 5%, response time > 1s, payment failures

5. **Legal & Compliance**
   - Privacy policy (DPDP Act 2023 compliant — Indian data protection)
   - Terms of service
   - Data processing agreement for schools
   - Cookie consent (for marketing site)

6. **Launch Checklist**
   - Load test: 50 concurrent teachers marking attendance
   - Test all Razorpay payment flows in production mode
   - Verify WhatsApp/SMS delivery rates
   - DNS, SSL, CDN all configured
   - 5 pilot schools onboarded for soft launch

**Verification:**

- Zero data leakage confirmed via automated cross-tenant tests
- System handles 50 concurrent users without degradation
- All payment flows tested with real Razorpay production credentials
- 5 pilot schools successfully onboarded and using the system

---

## NestJS Backend Module Map

```text
apps/api/src/
├── platform/
│   ├── auth/              # Platform admin auth
│   ├── tenants/           # Tenant CRUD, provisioning
│   ├── plans/             # Subscription plans
│   ├── billing/           # Razorpay integration, webhooks
│   └── analytics/         # Platform-wide metrics
├── school/
│   ├── auth/              # School user auth (phone OTP)
│   ├── users/             # School staff management
│   ├── students/          # Student CRUD, bulk import
│   ├── guardians/         # Parent management
│   ├── academics/         # Classes, sections, subjects
│   ├── attendance/        # Student + staff attendance
│   ├── fees/              # Fee structure, collection, receipts
│   ├── exams/             # Exam config, marks entry
│   ├── reports/           # Report cards, analytics
│   ├── communication/     # Notices, diary, messaging
│   └── calendar/          # Events, holidays
├── common/
│   ├── guards/            # Auth guard, tenant guard, subscription guard
│   ├── interceptors/      # Logging, tenant context
│   ├── decorators/        # @CurrentTenant, @CurrentUser
│   ├── filters/           # Exception filters
│   ├── middleware/         # Tenant resolution middleware
│   └── database/          # Drizzle config, tenant schema manager
└── main.ts
```

---

## Key Decisions Summary

| Decision      | Choice                                       | Reason                                 |
| ------------- | -------------------------------------------- | -------------------------------------- |
| Architecture  | Modular monolith (NestJS)                    | Solo developer, simpler ops            |
| Monorepo      | Turborepo + npm                              | Developer preference                   |
| Backend       | NestJS                                       | Developer preference, enterprise-grade |
| Frontend apps | 5 logical → 3 deployables                    | Reduce deployment overhead             |
| Database      | Neon PostgreSQL (Singapore)                  | Free tier, serverless                  |
| DB strategy   | Schema-per-tenant                            | Cost-effective at seed stage           |
| Auth          | Better Auth (self-hosted, phone OTP primary) | $0, India-optimized                    |
| Payments      | Razorpay                                     | India standard, UPI support            |
| Communication | WhatsApp (Interakt) + SMS (MSG91)            | Indian school expectation              |
| File storage  | Cloudflare R2                                | 10GB free, no egress charges           |
| Timeline      | 32 weeks solo                                | Realistic for one developer            |
| Launch target | CBSE + State Boards                          | Developer preference                   |
| Mobile        | Web-only first                               | Launch faster, PWA later               |

---

## Verification — How to Confirm Success

| Phase   | Test                                                                   |
| ------- | ---------------------------------------------------------------------- |
| Phase 0 | `npm run dev` starts all apps, Docker Compose runs, CI/CD green        |
| Phase 1 | School signs up → pays → gets provisioned → platform admin sees it     |
| Phase 2 | School admin sets up year, imports 100 students, teacher logs in       |
| Phase 3 | Teacher marks attendance in < 2 min, parent gets WhatsApp alert        |
| Phase 4 | Parent pays fee via UPI, PDF receipt generated, school sees collection |
| Phase 5 | Teacher enters marks, CBSE report card PDF generated, parent downloads |
| Phase 6 | Admin sends notice, 80%+ parents receive on WhatsApp                   |
| Phase 7 | New school self-onboards from marketing site in < 10 minutes           |
| Phase 8 | 50 concurrent users, zero cross-tenant leakage, 5 pilot schools live   |
