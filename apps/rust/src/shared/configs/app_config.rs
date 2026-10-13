use std::env;

pub struct AppConfig {
    pub name: String,
    pub version: String,
    pub env: String,
    pub port: u16,
}

pub fn get_config() -> AppConfig {
    AppConfig {
        name: env::var("APP_NAME").unwrap_or_else(|_| "starter-rust".to_string()),
        version: env::var("APP_VERSION").unwrap_or_else(|_| "0.1.0".to_string()),
        env: env::var("NODE_ENV").unwrap_or_else(|_| "development".to_string()),
        port: env::var("PORT")
            .unwrap_or_else(|_| "3002".to_string())
            .parse()
            .unwrap_or(3002),
    }
}
