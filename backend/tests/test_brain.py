"""Tests for brain routes, repository functions, telemetry tracking, and Pydantic validation."""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes.brain_routes import (
    router,
    ProviderUpdateModel,
    ApiKeyCreateModel,
    ApiKeyUpdateModel,
    TelemetryLogModel,
    PlaygroundMessageModel,
)


app = FastAPI()
app.include_router(router, prefix="/api/brain")


def mock_get_current_user():
    return {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}


app.dependency_overrides[
    "src.core.security.get_current_user"
] = mock_get_current_user


def test_pydantic_provider_update_model():
    valid_payload = {"isActive": True, "latency": 150, "status": "connected"}
    model = ProviderUpdateModel(**valid_payload)
    assert model.isActive is True
    assert model.latency == 150
    assert model.status == "connected"


def test_pydantic_api_key_create_model():
    valid = {"providerId": "openai", "label": "Main Key", "key": "sk-12345"}
    model = ApiKeyCreateModel(**valid)
    assert model.providerId == "openai"
    assert model.label == "Main Key"

    with pytest.raises(ValueError):
        ApiKeyCreateModel(providerId="", label="", key="")


def test_pydantic_telemetry_log_model():
    log = TelemetryLogModel(
        model="gpt-4o",
        provider="openai",
        tokensIn=100,
        tokensOut=200,
        latency=150,
        status=200,
        cost=0.002,
    )
    assert log.model == "gpt-4o"
    assert log.tokensIn == 100
    assert log.cost == 0.002


@pytest.mark.asyncio
async def test_telemetry_repository_logging():
    with patch(
        "src.database.mongodb.repositories.brain_repository._db"
    ) as mock_db:
        mock_collection = AsyncMock()
        mock_db.return_value = {"telemetry_logs": mock_collection, "llm_providers": mock_collection}

        from src.database.mongodb.repositories.brain_repository import log_telemetry_event_db

        result = await log_telemetry_event_db(
            user_id="test_user_123",
            telemetry_data={
                "model": "gpt-4o",
                "provider": "openai",
                "tokensIn": 100,
                "tokensOut": 200,
                "latency": 180,
                "status": 200,
                "cost": 0.0015,
            },
        )

        assert result["user_id"] == "test_user_123"
        assert result["model"] == "gpt-4o"
        assert result["tokensIn"] == 100
        assert result["tokensOut"] == 200
        assert result["cost"] == 0.0015
        assert mock_collection.insert_one.called
