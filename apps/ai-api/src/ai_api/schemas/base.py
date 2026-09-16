from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Wire schema exchanged with the NestJS gateway.

    The gateway reads and writes camelCase keys (``sourceRefs``, ``financeMonth``), so aliases are
    generated from the snake_case field names and accepted in both spellings on input.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
