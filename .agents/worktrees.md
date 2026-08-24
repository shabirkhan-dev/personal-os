# Agent worktree workflow

Every new implementation card gets its own Git branch and worktree. The shared `main` worktree
is an integration and inspection area; agents do not use it for new feature work.

This repository uses [WTP (Worktree Plus)](https://github.com/satococoa/wtp) for worktree
lifecycle management. Project configuration lives in `.wtp.yml`; the agent contract, ownership
map, board scope, and CI remain the authority for who may change what.

## Create a worktree

From the repository root:

```bash
wtp list
wtp add -b agent/backend-auth/auth-refresh main
```

WTP creates a branch-based path under:

```text
../personal-os-worktrees/agent/backend-auth/auth-refresh/
```

The `.wtp.yml` post-create hook runs `bun install --frozen-lockfile` in the new worktree. It does
not copy `.env` files or symlink dependency directories. Configure local environment files and
ports explicitly in the new worktree.

The command uses the selected base commit and does not include uncommitted changes from another
worktree. Finish or explicitly hand off active shared-main work before moving that card.

## Agent start sequence

1. Claim the card and set `assignee`, `branch`, `worktree`, `scope`, and `reviewer`.
2. Create the worktree with `wtp add -b agent/<role>/<card-slug> main`.
3. Enter it with `cd "$(wtp cd agent/<role>/<card-slug>)"` or use the shell integration from
   `wtp shell-init zsh`.
4. Confirm dependencies finished installing and configure local environment values.
5. Read the root instructions, `.agents/agent-contract.md`, the role charter, the card, and the
   relevant source-of-truth docs.
6. Work only within the card scope.

## Branch and port conventions

Branches use `agent/<role>/<card-slug>`. WTP preserves the branch hierarchy in the worktree path.

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
8. After merge, remove the clean worktree and branch when appropriate:

```bash
wtp remove --with-branch agent/backend-auth/auth-refresh
```

Use `--force` or `--force-branch` only after confirming that uncommitted or unmerged work is
disposable.

## Coordination rules

- WTP prevents filesystem collisions; it does not replace scope ownership or review.
- If a change crosses ownership, raise a card and list the shared paths and required reviewers.
- Do not copy uncommitted files between worktrees. Commit, cherry-pick, or hand off explicitly.
- Do not delete or reset another agent's branch or worktree.
- The PM tool should eventually create the card, branch, worktree, reviewer, and port metadata
  together.
