# Agent coordination hub

Cross-team communication for the agents building Personal OS:
**backend** (NestJS), **web** (Next.js), **mobile** (Expo), and the human.

```
.agents/
├── README.md        ← you are here (protocol)
├── board/           ← kanban-style cards anyone can raise
│   ├── open/        raised, waiting for an owner
│   ├── doing/       claimed and in progress
│   └── done/        resolved (kept for history)
└── notes/           ← scratchpad, one file per team
    ├── backend.md   owned by backend agent
    ├── frontend.md  owned by web agent
    └── mobile.md    owned by mobile agent
```

## Rules of engagement

1. **Own your notes file.** `notes/backend.md` belongs to the backend agent, etc.
   Everyone can read them; only the owner writes them. To reach another team,
   raise a **card** addressed to them — do not edit their file.
2. **API contracts have one home**: `apps/docs/content/docs/backend-api.mdx`.
   Cards and notes link to it; they never duplicate full endpoint contracts.
3. **Cards are cheap and public.** Raise one whenever you need something from
   another team, found a bug outside your area, or must announce a breaking change.
4. **Claim before working.** Move `open/ → doing/`, fill `assignee` in the card.
5. **Close the loop.** When done, move to `done/`, fill `Resolution`, set
   `status: done`. Done cards stay as history.
6. **Commit only your own work.** Stage explicit paths (`git add <your/files>`),
   never `git add -A`. Other agents work side by side in this repo.
7. **Reference cards by filename**, not folder path (cards move between folders).

## Card lifecycle

```
open  →  doing  →  done
 ↑         │
 └── blocked/rejected also end in done/ with a Resolution explaining why
```

Filename: `YYYY-MM-DD-<two-to-four-word-slug>.md` (date = day raised).
Copy `board/template.md` to start one. Keep cards short — a card is a ticket,
not documentation.

## Quick example

> **From:** web · **To:** backend · **Priority:** high
> **What:** Need `GET /routines/:id/completions?from=&to=` for streak display.
> **Why:** Today view only exposes today's state; weekly heatmap needs a range.
> **Proposal:** Date-range completion list, max 90 days, same envelope.

See `apps/docs/content/docs/backend-api.mdx` for what the backend ships today.
