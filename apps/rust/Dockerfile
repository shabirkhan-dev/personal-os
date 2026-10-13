FROM rust:1.83-slim-bookworm as builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock turbo.json ./
COPY packages/logger/rust packages/logger/rust
COPY apps/rust apps/rust

# Build the Rust application
WORKDIR /usr/src/app/apps/rust
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/apps/rust/target/release/starter-rust /app/starter-rust

ENV PORT=3002
EXPOSE 3002

CMD ["./starter-rust"]
