from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommendation import check_conflicts, get_recommendations

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Payload(BaseModel):
  desired_ingredients: List[str]  # Accepts an array from React
  product_type: Optional[str] = None


@app.post("/recommendations")
def recommendations(payload: Payload):
  if isinstance(payload.desired_ingredients, list):
    user_ingredients = payload.desired_ingredients
    user_query_str = ", ".join(payload.desired_ingredients)
  else:
    user_ingredients = [
        i.strip() for i in payload.desired_ingredients.split(",")
    ]
    user_query_str = payload.desired_ingredients

  recs = get_recommendations(
      user_query=user_query_str, product_type=payload.product_type
  )

  conflicts = check_conflicts(user_ingredients)

  return {
      "status": "success",
      "recommendations": recs,
      "warnings": conflicts,
  }