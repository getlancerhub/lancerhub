# LancerHub

**Open-source client portal & operations platform for freelancers.**

LancerHub is a self-hostable alternative to tools like HoneyBook, Bonsai, and Dubsado — built for freelancers who want full control over their data, integrations, and infrastructure.

You can:

- Run it yourself on your own VPS
- Or use the official cloud version
- Or fork it and extend it with plugins

LancerHub is built with modern TypeScript infrastructure and designed to be modular, extensible, and production-ready.

---

# What Problem Does LancerHub Solve?

Freelancers today juggle:

- Stripe for payments
- Notion for project management
- Google Drive for files
- Email tools for communication
- Form tools for lead capture
- Separate client portals (or none at all)

LancerHub brings these together into one unified system:

- Client portals
- Projects & milestones
- Invoicing via Stripe
- Forms for intake and scope changes
- Storage for deliverables
- Email notifications
- Open API for integrations

Without vendor lock-in.

---

# Core Features

## Client Portals

Each client gets a secure portal where they can:

- View project updates
- Access files and links
- Pay invoices
- Submit forms
- Track project status

---

## Projects

Projects contain:

- Milestones
- Deliverables
- Timeline updates
- Client-visible activity

Projects belong to a workspace (your freelance business).

---

## Invoicing (Stripe Connect)

Freelancers connect their own Stripe account.

LancerHub:

- Creates invoices
- Tracks payment status
- Receives webhook confirmations
- Optionally unlocks deliverables on payment

Funds go directly to the freelancer.

---

## Forms

Two primary form types:

### Lead Forms

Public intake forms to capture new client inquiries.

### Scope Change Forms

Clients can submit change requests.

In future versions:

- AI-assisted classification determines if a request is in scope or requires a change order.

---

## Email

Self-host version:

- You must bring your own email provider (SMTP or API).

Cloud version:

- Use your own provider
- Or send through `clients@lancerhub.org`

All emails are transactional only (login links, invoices, notifications).

---

## Storage

Files are stored using S3-compatible storage:

- Self-host → MinIO
- Cloud → S3 or R2

Storage is abstracted through a provider layer.

---

## Open API

LancerHub exposes a versioned REST API:

```
/api/v1/...
```

The API supports:

- Workspaces
- Clients
- Projects
- Invoices
- Forms
- Events

API keys can be generated per workspace.

---

## Plugin System

LancerHub is designed to be extendable.

Two extension methods:

### Webhooks

Subscribe to events like:

- invoice.paid
- form.submitted
- project.updated

### Future Plugin Runtime

A controlled execution environment for internal plugins.

Events are delivered through a transactional outbox system to prevent data loss.

---

# Architecture Overview

LancerHub is a modular monorepo built with TypeScript.

## High-Level Components

1. Web App (Next.js)
2. API Server (Fastify)
3. Worker Service
4. Postgres Database
5. Redis Queue
6. S3-Compatible Storage
7. Reverse Proxy (Caddy)
8. Docker Compose (orchestrates everything)

---

## Monorepo Structure

```
apps/
  web/        → Next.js frontend
  api/        → REST API
  worker/     → background job processor

packages/
  db/         → database schema & migrations
  sdk/        → typed API client
  plugin-kit/ → plugin definitions & event types

infra/
  compose/    → Docker setup

docs/
```

---

# How The Parts Work Together

### Web App

- Renders dashboard and client portal
- Calls the API
- Handles authentication sessions

### API

- Contains business logic
- Handles Stripe webhooks
- Stores data in Postgres
- Emits events to outbox

### Worker

- Processes background jobs:
  - Sending emails
  - Delivering webhooks
  - AI scope analysis
  - PDF invoice generation

### Postgres

Primary data store:

- Users
- Workspaces
- Projects
- Clients
- Invoices
- Forms
- Event outbox

### Redis

Used for:

- Job queues
- Rate limiting
- Temporary session data (optional)

### Storage

Handles:

- Deliverables
- Attachments
- Form uploads

---

# Deployment Model

## Self-Hosted

One command:

```
docker compose up -d
```

Includes:

- Postgres
- Redis
- MinIO
- API
- Worker
- Web
- Reverse proxy

Migrations run automatically on startup.

You must configure:

- Domain
- Email provider
- Stripe keys

---

## Cloud Hosted

The official hosted version:

- Uses shared infrastructure
- Same core codebase
- Optional shared email sending

---

# Database & Migrations

- Built using Drizzle ORM
- Migrations are idempotent
- Automatically run during container startup
- Uses transactional outbox pattern for events

---

# Security Model

- Workspace-based multi-tenancy
- Role-based access control (Owner, Admin, Client)
- JWT-based authentication
- HttpOnly cookies
- Stripe webhook signature verification
- Rate limiting enabled

---

# Technology Stack

Frontend:

- Next.js
- TypeScript
- TailwindCSS

Backend:

- Fastify
- TypeScript
- Drizzle ORM
- PostgreSQL

Infrastructure:

- Docker
- Redis
- MinIO (S3 compatible)
- Caddy

---

# Why Open Source?

Freelancers should:

- Own their client data
- Control their integrations
- Avoid platform lock-in
- Extend their workflow however they want

LancerHub is built as infrastructure, not just software.

---

# Roadmap

- Stripe Connect fully wired
- AI-powered scope assistant
- Notion integration
- Template marketplace
- Plugin ecosystem
- Multi-workspace support
- Role-based fine-grained permissions
- Custom domain portals

---

# Vision

LancerHub is not just a freelancer CRM.

It is a freelancer operating system.

- Payments
- Projects
- Communication
- Automation
- Extensibility

All under your control.
