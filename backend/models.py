from typing import Annotated, List, Optional
from bson import ObjectId
from pydantic import AliasChoices, BaseModel, BeforeValidator, Field

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, validation_alias=AliasChoices("_id", "id"))

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self) -> dict:
        d = self.model_dump(exclude={"id"})
        if self.id:
            d["_id"] = ObjectId(self.id)
        return d


class Variant(BaseModel):
    label_cz: str = ""
    label_en: str = ""
    price: int
    allergens: List[int] = []


class CategoryIn(BaseModel):
    name_cz: str
    name_en: str = ""


class Category(BaseDocument, CategoryIn):
    sort_order: int = 0


class MenuItemIn(BaseModel):
    category_id: PyObjectId
    number: str = ""
    name: str
    name_en: str = ""
    desc_cz: str = ""
    desc_en: str = ""
    price: Optional[int] = None
    allergens: List[int] = []
    variants: List[Variant] = []
    image: str = ""
    vegetarian: bool = False
    vegan: bool = False
    visible: bool = True
    featured: bool = False


class MenuItem(BaseDocument, MenuItemIn):
    sort_order: int = 0


class DailyItem(BaseModel):
    name: str
    desc_cz: str = ""
    desc_en: str = ""
    price: int
    allergens: List[int] = []


class DailyMenuIn(BaseModel):
    published: bool = False
    note_cz: str = ""
    note_en: str = ""
    items: List[DailyItem] = []


class DailyMenu(BaseDocument, DailyMenuIn):
    date: str
    updated_at: str = ""


class User(BaseDocument):
    email: str
    name: str = ""
    role: str = "admin"


class LoginIn(BaseModel):
    email: str
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class OrderIn(BaseModel):
    ids: List[str]


class VisibilityIn(BaseModel):
    visible: bool
