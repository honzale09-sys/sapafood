from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging  # noqa: E402
import os  # noqa: E402

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.concurrency import run_in_threadpool  # noqa: E402
from fastapi.exceptions import RequestValidationError  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

import auth  # noqa: E402
import routes_admin  # noqa: E402
import routes_public  # noqa: E402
import ordering  # noqa: E402
from db import client  # noqa: E402
from seed import seed_content  # noqa: E402
from storage import init_storage  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Sapa Food API", openapi_url="/api/openapi.json", docs_url="/api/docs", redoc_url=None)

FIELD_LABELS = {"price": "Cena", "name": "Název", "name_cz": "Název", "allergens": "Alergeny", "category_id": "Kategorie",
                "email": "E-mail", "password": "Heslo", "items": "Položky", "phone": "Telefon",
                "pickup": "Čas vyzvednutí", "lines": "Položky", "qty": "Počet"}


FIELD_LABELS_VI = {"price": "Giá", "name": "Tên món", "name_cz": "Tên", "allergens": "Chất gây dị ứng", "category_id": "Danh mục",
                   "email": "Email", "password": "Mật khẩu", "items": "Món", "date": "Ngày"}

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    # The admin is used by Vietnamese-speaking staff; customers get Czech.
    vi = request.url.path.startswith(("/api/admin", "/api/auth"))
    labels = FIELD_LABELS_VI if vi else FIELD_LABELS
    msgs = []
    for e in exc.errors():
        field = next((str(p) for p in reversed(e.get("loc", [])) if isinstance(p, str) and p != "body"), "")
        label = labels.get(field, field or ("Ô" if vi else "Pole"))
        if field == "price":
            msgs.append("Giá phải là số nguyên dương." if vi else "Cena musí být kladné celé číslo.")
        elif e.get("type") == "missing":
            msgs.append(f"{label}: {'bắt buộc' if vi else 'povinné pole'}.")
        else:
            msgs.append(f"{label}: {'giá trị không hợp lệ' if vi else 'neplatná hodnota'}.")
    fallback = "Dữ liệu không hợp lệ." if vi else "Neplatná data."
    return JSONResponse(status_code=422, content={"detail": " ".join(dict.fromkeys(msgs)) or fallback})


app.include_router(auth.router)
app.include_router(routes_public.router)
app.include_router(routes_admin.router)
app.include_router(ordering.router)
app.mount("/api/static", StaticFiles(directory=ROOT_DIR / "static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_content()
    await auth.seed_admin()
    try:
        await run_in_threadpool(init_storage)
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
