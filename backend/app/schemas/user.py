from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class UserUpdateRequest(BaseModel):
    telephone: str | None = Field(default=None, min_length=3, max_length=32, description="New unique phone number.")
    telegram_id: str | None = Field(default=None, min_length=3, max_length=64, description="New unique Telegram ID.")
    first_name: str | None = Field(default=None, min_length=1, max_length=120, description="First name.")
    last_name: str | None = Field(default=None, min_length=1, max_length=120, description="Last name.")
    age: int | None = Field(default=None, ge=0, le=120, description="Age.")
    gender: str | None = Field(default=None, min_length=1, max_length=32, description="Gender.")

    @model_validator(mode="after")
    def validate_identifiers(self) -> "UserUpdateRequest":
        if self.telephone == "" or self.telegram_id == "":
            raise ValueError("telephone and telegram_id cannot be empty strings")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"first_name": "Ali", "last_name": "Valiyev"},
                {"telephone": "+998909999999"},
                {"telegram_id": "777777777", "age": 29, "gender": "male"},
            ]
        }
    }


class UserRead(BaseModel):
    id: str
    telephone: str | None
    telegram_id: str | None
    first_name: str | None
    last_name: str | None
    age: int | None
    gender: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "3a6dc68b-4459-4e6d-9b31-a9da2f013cc0",
                "telephone": "+998901234567",
                "telegram_id": "123456789",
                "first_name": "Ali",
                "last_name": "Valiyev",
                "age": 28,
                "gender": "male",
                "created_at": "2026-04-25T12:00:00Z",
            }
        },
    }
