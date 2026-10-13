# @starter/logger

Beautiful, injectable logger for TypeScript/JavaScript and Rust. Same design in both: levels, colors, timestamps, optional prefix, and child loggers.

## TypeScript / JavaScript

**Install:** Add `@starter/logger` to your app (workspace dependency).

```ts
import { createLogger } from "@starter/logger";

const log = createLogger({ prefix: "app" });
log.info("Server started");
log.warn("Deprecated option");
log.error("Connection failed");

const httpLog = log.child("http");
httpLog.info("GET / 200");
```

**Options:** `prefix`, `minLevel` (`DEBUG` | `INFO` | `WARN` | `ERROR`), `transport`, `useColors`, `isoTime`.

## Rust

**Install:** In your `Cargo.toml`:

```toml
[dependencies]
starter-logger = { path = "../../packages/logger/rust" }
```

```rust
use starter_logger::Logger;

let log = Logger::new().with_prefix("app");
log.info("Server started");
log.warn("Deprecated option");
log.error("Connection failed");

let http_log = log.child("http");
http_log.info("GET / 200");
```

**Builder:** `with_prefix()`, `with_min_level(Level::Info)`, `with_transport(Box::new(|line, level| { ... }))`.

## Output (both)

```
 12:34:56.789  DEBUG  app › http GET /
 12:34:56.790  INFO   app › http 200
 12:34:56.791  WARN   Deprecated option
 12:34:56.792  ERROR  Connection failed
```

Colors: dim cyan (debug), green (info), bold yellow (warn), bold red (error). Timestamp in dim gray.
