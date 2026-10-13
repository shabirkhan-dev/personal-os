# Starter Rust app

Rust binary in the starter monorepo. Lives under **`apps/rust`** so Turbo can run `build` / `dev` from root via `bun run build` / `bun run dev` (Rust app is included when Turbo runs those tasks).

## Prerequisites

- [Rust](https://rustup.rs/) (stable). The repo uses `rust-toolchain.toml`; `rustup` will install the right channel and components (rustfmt, clippy).

## Commands (from repo root or from `apps/rust`)

| From root | From `apps/rust` | Purpose |
|-----------|------------------|---------|
| `bun run build` (Turbo) | `cargo build --release` | Release build |
| `bun run dev` (Turbo) | `cargo run` | Build and run |
| — | `cargo test` | Tests |
| — | `cargo fmt` | Format |
| — | `cargo clippy` | Lint |

## QoL / goodies

- **rust-toolchain.toml** – Pins stable, adds `rustfmt` and `clippy`.
- **rustfmt.toml** – Formatting (max width 100, edition 2021).
- **.cargo/config.toml** – Aliases: `cargo b`, `cargo r`, `cargo t`, `cargo c` (clippy), `cargo f` (fmt).
- **Cargo.toml** – Release profile: LTO, single codegen unit for smaller/faster binaries.

Optional (install with `cargo install`):

- **cargo-watch** – `cargo watch -x run` for auto-run on change.
- **cargo-audit** – `cargo audit` for dependency security.
- **cargo-nextest** – Faster test runner: `cargo nextest run`.
