from pydantic import BaseModel


class ResourceRead(BaseModel):
    id: str
    slug: str
    title: str
    description: str | None

    model_config = {"from_attributes": True}


class ResourceContentRead(BaseModel):
    slug: str
    content: str
