# Agent worktree workflow

Every new implementation card gets its own Git branch and worktree. The shared `main` worktree
is an integration and inspection area; agents do not use it for new feature work.

## Create a worktree

From the repository root:

```bash
bun run worktree -- list
bun run worktree -- add backend-auth auth-refresh
```

This creates:

```text
../personal-os-worktrees/backend-auth/auth-refresh/
branch: agent/backend-auth/auth-refresh
```

The role must have a charter under `.agents/roles/`. The card slug should match the board card or
be a short, stable description of the change.

The helper warns when `main` has uncommitted changes. A new worktree starts from the selected base
commit and does not include uncommitted changes from another worktree. Finish or explicitly hand
off active shared-main work before moving that card.

## Agent start sequence

1. Claim the card and set `assignee`, `branch`, `worktree`, `scope`, and `reviewer`.
2. Create the worktree with `bun run worktree -- add <role> <card-slug>`.
3. Enter the printed path.
4. Run `bun install --frozen-lockfile`.
5. Configure a unique local port set and environment values; never commit `.env` files.
6. Read the root instructions, `.agents/agent-contract.md`, the role charter, the card, and the
   relevant source-of-truth docs.
7. Work only within the card scope.

## Branch and port conventions

Branches use `agent/<role>/<card-slug>`. Worktrees live outside the repository at
`../personal-os-worktrees/<role>/<card-slug>` by default. Override the parent directory with
`PERSONAL_OS_WORKTREE_ROOT` when required.

The canonical single-worktree development ports are:

| Service | Canonical port |
| --- | ---: |
| Web | 3000 |
| Docs | 3002 |
| Nest API | 4000 |
| AI API | 8000 |
| Expo/Metro | 8081 |

Parallel agents must choose non-conflicting ports and record them on the card. A simple local
scheme is to add a role slot to each port: backend-auth `+10`, backend-product `+20`,
backend-platform `+30`, web `+40`, and mobile `+50`.

## Agent finish sequence

1. Inspect `git diff --name-only` and compare it with the card scope.
2. Run the role and card validation commands.
3. Stage explicit paths only; never stage another agent's work.
4. Commit using a lowercase Conventional Commit message.
5. Push the agent branch, not `main`.
6. Record validation, review, commit, and follow-up work on the card.
7. Merge only after owner review, independent review, scope checks, and CI pass.
8. Remove the worktree only after it is clean:

```bash
bun run worktree -- remove backend-auth auth-refresh
```

The helper refuses to remove a dirty worktree. Use `remove --force` only after confirming that
uncommitted work is disposable.

## Coordination rules

- A worktree prevents filesystem collisions; it does not replace scope ownership or review.
- If a change crosses ownership, raise a card and list the shared paths and required reviewers.
- Do not copy uncommitted files between worktrees. Commit, cherry-pick, or hand off explicitly.
- Do not delete or reset another agent's branch or worktree.
- The PM tool should eventually create this branch/worktree metadata automatically from the card.
