use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

async fn health() -> Json<Value> {
    Json(json!({
        "success": true,
        "code": 200,
        "message": "OK",
        "data": { "status": "ok", "env": "development" }
    }))
}

pub fn create_app(pool: sqlx::PgPool) -> Router {
    crate::modules::create_router(pool)
        .route("/health", get(health))
        .route("/", get(|| async { Json(json!({ "success": true, "code": 200, "message": "OK", "data": { "name": "starter-rust", "version": "0.1.0" } })) }))
}
