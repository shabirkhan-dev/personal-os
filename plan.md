# Personal OS — Project Plan

Date: 2026-07-20
Status: living document. Vision and domains below; implementation follows in phases on the Starter kit base.

---

## 1. What we are building

**Personal OS** is a personal life operating system — everything about *your* life in one place: basic daily stuff, finance, skincare and personal care routines, food, fashion, and habits.

### 1.1 Core domains

| Module | Purpose |
| --- | --- |
| Routines | Daily and weekly schedules, habit tracking |
| Finance | Budgets, transactions, goals |
| Personal care | Skincare, grooming, wellness logs |
| Food | Meals, nutrition, planning |
| Fashion | Wardrobe, outfits, style notes |
| Dashboard | Unified timeline and insights across domains |

### 1.2 Target experience

> Open Personal OS → log a routine or expense → see your day, week, and goals in one calm dashboard — on web or mobile.

---

## 2. Where we are today

**Maturity: Starter kit scaffold.** Web, mobile, API, docs, CI, and Docker are in place. Domain-specific product modules are **not implemented yet**.

### 2.1 Implemented (platform)

- Bun + Turborepo monorepo with Next.js, Expo, NestJS, Fumadocs
- Auth spine, shared UI, Lefthook, Biome, architecture checks, CI/CD
- Docker Compose and Dev Container

### 2.2 Planned (product)

- Domain modules (routines, finance, care, food, fashion)
- Unified user profile and timeline
- Mobile-first logging and reminders
- AI assist for planning meals, outfits, and habits

---

## 3. Near-term milestones

1. **M1 — Profile & routines:** auth, daily routine CRUD, mobile logging
2. **M2 — Finance:** budgets and transaction tracking
3. **M3 — Care & food:** skincare routines and meal planning
4. **M4 — Fashion & AI:** wardrobe module and assistive planning

---

## 4. What this is not

- Not a generic corporate productivity suite
- Not a social network
- Not shared multi-tenant admin (this is *your* OS first)
