import os
from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Configure before importing the app so settings cache is correct. Assign rather than default:
# bun and the dev shell export AI_SERVICE_TOKEN from the root .env, and a stale value there makes
# every authenticated request 401.
os.environ["ENVIRONMENT"] = "test"
os.environ["AI_SERVICE_TOKEN"] = "test-ai-service-token"
os.environ["AI_PROVIDER"] = "mock"


def _clear_caches() -> None:
    from ai_api.api.deps import (
        get_assist_service,
        get_chat_service,
        get_intelligence_service,
        get_llm_provider,
    )
    from ai_api.config.settings import get_settings

    get_settings.cache_clear()
    get_llm_provider.cache_clear()
    get_assist_service.cache_clear()
    get_intelligence_service.cache_clear()
    get_chat_service.cache_clear()


@pytest.fixture()
def app() -> Iterator[FastAPI]:
    from ai_api.main import create_app

    _clear_caches()
    application = create_app()
    yield application
    application.dependency_overrides.clear()
    _clear_caches()


@pytest.fixture()
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def service_headers() -> dict[str, str]:
    return {"X-AI-Service-Token": "test-ai-service-token"}
