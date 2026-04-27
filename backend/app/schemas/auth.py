from pydantic import BaseModel, Field, model_validator


class RegisterRequest(BaseModel):
    telephone: str | None = Field(default=None, min_length=3, max_length=32, description="User phone number. Required if telegram_id is not provided.")
    telegram_id: str | None = Field(default=None, min_length=3, max_length=64, description="Telegram user ID. Required if telephone is not provided.")
    first_name: str | None = Field(default=None, min_length=1, max_length=120, description="User first name.")
    last_name: str | None = Field(default=None, min_length=1, max_length=120, description="User last name.")
    age: int | None = Field(default=None, ge=0, le=120, description="User age.")
    gender: str | None = Field(default=None, min_length=1, max_length=32, description="User gender.")

    @model_validator(mode="after")
    def validate_identifiers(self) -> "RegisterRequest":
        if not self.telephone and not self.telegram_id:
            raise ValueError("Either telephone or telegram_id is required")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "telephone": "+998901234567",
                    "first_name": "Ali",
                    "last_name": "Valiyev",
                    "age": 28,
                    "gender": "male",
                },
                {
                    "telegram_id": "123456789",
                    "first_name": "Aziza",
                    "gender": "female",
                },
            ]
        }
    }


class LoginRequest(BaseModel):
    telephone: str | None = Field(default=None, min_length=3, max_length=32, description="Use telephone for login. Provide exactly one identifier.")
    telegram_id: str | None = Field(default=None, min_length=3, max_length=64, description="Use telegram_id for login. Provide exactly one identifier.")

    @model_validator(mode="after")
    def validate_identifiers(self) -> "LoginRequest":
        provided = [value for value in (self.telephone, self.telegram_id) if value]
        if len(provided) != 1:
            raise ValueError("Provide exactly one of telephone or telegram_id")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"telephone": "+998901234567"},
                {"telegram_id": "123456789"},
            ]
        }
    }


class AuthResponse(BaseModel):
    user_id: str
    telephone: str | None
    telegram_id: str | None
    first_name: str | None
    last_name: str | None
    age: int | None
    gender: str | None
    csrf_token: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "3a6dc68b-4459-4e6d-9b31-a9da2f013cc0",
                "telephone": "+998901234567",
                "telegram_id": None,
                "first_name": "Ali",
                "last_name": "Valiyev",
                "age": 28,
                "gender": "male",
                "csrf_token": "csrf-token-value",
            }
        }
    }
