# Board conventions

This folder is the Personal OS project board. Cards are markdown files; the folder is the status.

| Folder | Meaning |
| --- | --- |
| `open/` | Raised, not started. Ordered by `priority`, then date. |
| `doing/` | Claimed and in progress. Keep it to one or two cards. |
| `done/` | Finished, blocked or rejected, with a Resolution. Kept as history. |

Card ids are `pos-<number>`, increasing; take the next free number.

- **Raise a card** by copying `template.md` into `open/` with the naming scheme
  `YYYY-MM-DD-<slug>.md`, then filling every field.
- **Claim a card** by moving it `open/ → doing/`, setting `assignee` and
  `status: doing`.
- **Close a card** by moving it to `done/`, filling `Resolution`, and setting
  `status: done`. Do not delete cards.
- **Status lives in the folder AND the frontmatter** — keep both in sync so
  grep stays reliable.
- Cards are small tickets. Long-form design thinking goes in your team's notes
  file or the docs app, linked from the card.
