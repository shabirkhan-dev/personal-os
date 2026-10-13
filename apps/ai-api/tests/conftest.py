import os

import pytest
from fastapi.testclient import TestClient

# Configure before importing the app so settings cache is correct.
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("AI_SERVICE_TOKEN", "test-ai-service-token")
os.environ.setdefault("AI_PROVIDER", "mock")


@pytest.fixture()
def client() -> TestClient:
    from ai_api.api.deps import get_assist_service
    from ai_api.config.settings import get_settings
    from ai_api.main import create_app

    get_settings.cache_clear()
    get_assist_service.cache_clear()
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()
    get_assist_service.cache_clear()


@pytest.fixture()
def service_headers() -> dict[str, str]:
    return {"X-AI-Service-Token": "test-ai-service-token"}
