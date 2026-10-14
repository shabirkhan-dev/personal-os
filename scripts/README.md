# Scripts

Repository automation, all in Bash. App code lives in `apps/*`; nothing here ships to users.

## Layout

```
scripts/
├── architecture/
│   ├── check-boundaries.sh   # import-boundary rules (bun run architecture:check)
│   └── check-naming.sh       # kebab-case file and folder names (bun run naming:check)
├── git-hooks/                # called by Lefthook (lefthook.yml)
│   ├── check-large-files.sh
│   ├── check-secrets.sh
│   ├── commit-msg-check.sh
│   └── fix-trailing-whitespace.sh
├── .shellcheckrc
└── README.md
```

## Commands (from root)

| Command | Purpose |
| --- | --- |
| `bun run scripts:lint` | ShellCheck over every script here |
| `bun run scripts:format` | shfmt (4-space indent) over every script here |
| `bun run architecture:check` | Import boundaries |
| `bun run naming:check` | File and folder naming |

## Prerequisites

**ShellCheck** and **shfmt**. Versions are pinned in `.mise.toml`; the Dev Container installs both.
