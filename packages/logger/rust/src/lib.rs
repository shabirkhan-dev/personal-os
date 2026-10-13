//! starter-logger — Beautiful, injectable logger for Rust. Use `Logger::new()` and inject anywhere.

mod format;
mod level;
mod logger;

pub use format::{format_line, format_timestamp, FormatOptions};
pub use level::{Level, RESET, DIM};
pub use logger::{Logger, Transport};
