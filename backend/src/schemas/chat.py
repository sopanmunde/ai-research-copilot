from pydantic import BaseModel, field_validator
from typing import Optional, Literal


class QueryRequest(BaseModel):
    msg: str
    conversation_id: Optional[str] = None

    mode: str = "agent"

    workflow_type: str = "research"

    model_provider: Optional[str] = None

    model_name: Optional[str] = None
    filename: Optional[str] = None
    active_features: Optional[dict] = None
    is_voice: Optional[bool] = False

    @field_validator("mode")
    @classmethod
    def normalize_mode(cls, v: str) -> str:
        mapping = {
            "simple": "quick",
            "research": "agent",
        }
        return mapping.get(v, v)

    @field_validator("workflow_type")
    @classmethod
    def normalize_workflow(cls, v: str) -> str:
        allowed = {
            "research", "summary", "technical", "competitive",
            "coding", "data_analysis",
        }
        if v not in allowed:
            return "research"
        return v
