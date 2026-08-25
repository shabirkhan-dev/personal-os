---
title: Grant PM controlled integration authority
status: doing
assignee: Codex PM
reviewer: human project owner
scope:
  - .agents/agent-contract.md
  - .agents/README.md
  - .agents/roles/pm.md
acceptance:
  - PM may integrate reviewed agent branches only after explicit human approval.
  - Independent review, CI, clean-worktree, scope, and conflict gates remain mandatory.
  - PM cannot waive gates, force-push, reset or delete unmerged work, or approve its own code.
validation:
  - git diff --check
  - inspect policy wording for consistency across contract, README, and PM role
---

Resolution:

Changed:
- `.agents/agent-contract.md`
- `.agents/README.md`
- `.agents/roles/pm.md`

Review:
- Human product owner explicitly requested and approved this coordination-policy change.
