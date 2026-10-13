# Starter scripts

Scripts live under **`scripts/`** at repo root, organized by language: **bash**, **python**.

## Layout

```
scripts/
├── bash/           # Bash – ShellCheck, shfmt
│   ├── main.sh
│   └── .shellcheckrc
├── python/         # Python – ruff (lint + format)
│   ├── main.py
│   └── pyproject.toml
└── README.md       # This file
```

## Commands (from root)

| Command | Purpose |
|---------|---------|
| `bun run scripts:lint` | Lint bash (ShellCheck), python (ruff) |
| `bun run scripts:format` | Format bash (shfmt), python (ruff format) |
| `bun run scripts:run` | Run bash main script (same as `scripts:run:bash`) |
| `bun run scripts:run:bash` | Run `scripts/bash/main.sh` |
| `bun run scripts:run:python` | Run `scripts/python/main.py` |
| `bun run test:scripts` | Run script tests for bash and python |

## Prerequisites

- **Bash** – for `scripts/bash`
- **Python 3.11+** – for `scripts/python`

Optional (for lint/format):

- Bash: **ShellCheck**, **shfmt** (e.g. `pacman -S shellcheck shfmt`)
- Python: **ruff** (e.g. `pip install ruff` or `pacman -S ruff`)

## QoL / goodies

- **bash** – `.shellcheckrc`, shfmt 4-space indent.
- **python** – `pyproject.toml` (ruff + black-style line-length 100, Python 3.11).

