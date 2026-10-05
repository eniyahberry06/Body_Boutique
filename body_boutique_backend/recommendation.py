import os
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing from your .env file!")

client = OpenAI(api_key=api_key)


def create_AI_explanation(user_input, product_name, product_ingredients):
    """
        Generates tailored product explanations locally using ingredient matching rules
        without requiring an external OpenAI API call or API credits.
        """
    ingreds_lower = product_ingredients.lower()
    concerns = [c.strip().lower() for c in user_input.get('skin_concerns', '').split(',') if c.strip()]
    desired = [i.strip().lower() for i in user_input.get('desired_ingredients', '').split(',') if i.strip()]

    highlights = []

    # Ingredient specific highlights
    if 'salicylic acid' in ingreds_lower or 'bha' in ingreds_lower:
        highlights.append("Salicylic Acid to penetrate deep into pores and clarify skin")
    if 'niacinamide' in ingreds_lower:
        highlights.append("Niacinamide to calm redness and refine texture")
    if 'hyaluronic acid' in ingreds_lower or 'sodium hyaluronate' in ingreds_lower:
        highlights.append("Hyaluronic Acid for intense hydration")
    if 'retinol' in ingreds_lower or 'retinoid' in ingreds_lower:
        highlights.append("Retinol to promote skin cell turnover")
    if 'centella' in ingreds_lower or 'cica' in ingreds_lower or 'calendula' in ingreds_lower:
        highlights.append("soothing botanical extracts to relieve sensitivity")
    if 'vitamin c' in ingreds_lower or 'ascorbic acid' in ingreds_lower:
        highlights.append("Vitamin C to boost radiance and even tone")

    # Concern specific fallbacks
    if not highlights:
        for concern in concerns:
            if 'acne' in concern:
                highlights.append("clarifying agents that target breakout-prone areas")
            elif 'redness' in concern or 'sensitive' in concern:
                highlights.append("gentle ingredients formulated to soothe irritation")
            elif 'dry' in concern or 'eczema' in concern:
                highlights.append("nourishing humectants to restore skin moisture")

    # Construct dynamic explanation
    if highlights:
        explanation = f"Formulated with {' and '.join(highlights[:2])}."
    else:
        explanation = f"Specially blended to support skin targeting {user_input.get('skin_concerns', 'your target routine')}."

    return explanation

df = pd.read_csv("data/skincare_products_clean.csv")

df['clean_ingreds'] = df['clean_ingreds'].fillna('')
df['product_name'] = df['product_name'].fillna('')
df['product_type'] = df['product_type'].fillna('')


def get_sensory_tags(row):
  ingreds = row['clean_ingreds'].lower()
  name = row['product_name'].lower()
  p_type = row['product_type'].lower()

  tags = []

  fragrance_indicators = [
      'parfum',
      'fragrance',
      'limonene',
      'linalool',
      'citronellol',
      'geraniol',
      'eugenol',
      'citrus',
      'lavender oil',
  ]
  if any(indicator in ingreds for indicator in fragrance_indicators):
    tags.append('scented')
    if any(
        c in ingreds
        for c in ['limonene', 'citrus', 'orange', 'lemon', 'grapefruit']
    ):
      tags.append('citrus scented')
  else:
    tags.append('unscented')

  texture_keywords = [
      'gel',
      'cream',
      'lotion',
      'oil',
      'balm',
      'water',
      'lightweight',
      'rich',
      'foam',
      'milky',
  ]
  for keyword in texture_keywords:
    if keyword in name or keyword in p_type or keyword in ingreds:
      tags.append(f'{keyword} texture')

  return ' '.join(tags)


df['sensory_tags'] = df.apply(get_sensory_tags, axis=1)

df['search_text'] = (
    df['clean_ingreds']
    + ' '
    + df['product_name']
    + ' '
    + df['product_type']
    + ' '
    + df['sensory_tags']
).str.lower()

tfidf = TfidfVectorizer(
    tokenizer=lambda x: [i.strip() for i in x.split(',')], token_pattern=None
)

tfidf_matrix = tfidf.fit_transform(df['clean_ingreds'])

def get_baseline_recommendations(desired_ingredients, product_type=None, top_n=5):
    """
    Simple Baseline: Strict substring match requiring ALL input ingredients
    to appear in clean_ingreds without vector scoring.
    """
    filtered_df = df.copy()

    if product_type and product_type.lower() != 'any':
        filtered_df = filtered_df[
            filtered_df['product_type'].str.lower() == product_type.lower()
        ]

    # Filter strictly for products containing all query ingredients
    for ing in desired_ingredients:
        filtered_df = filtered_df[
            filtered_df['clean_ingreds'].str.lower().str.contains(ing.lower(), regex=False)
        ]

    if filtered_df.empty:
        return []

    return filtered_df.head(top_n)[['product_name', 'clean_ingreds', 'product_type']].to_dict(orient='records')

CONFLICT_RULES = {
    'retinol': ['glycolic acid', 'salicylic acid', 'lactic acid', 'vitamin c'],
    'vitamin c': ['retinol', 'glycolic acid', 'salicylic acid'],
    'glycolic acid': ['retinol', 'vitamin c'],
    'salicylic acid': ['retinol', 'vitamin c'],
}


def check_conflicts(ingredient_list):
  found_conflicts = []
  text = ' '.join(ingredient_list).lower()

  for active, incompatibles in CONFLICT_RULES.items():
    if active in text:
      for bad_match in incompatibles:
        if bad_match in text:
          found_conflicts.append(
              f'Conflict detected: Avoid pairing {active.title()} with'
              f' {bad_match.title()}.'
          )

  return list(set(found_conflicts))


def get_recommendations(user_query, product_type=None, top_n=5):
  filtered_df = df.copy()

  # Filter by category if specified (e.g., 'Moisturizer', 'Serum')
  if product_type:
    filtered_df = filtered_df[
        filtered_df['product_type'].str.lower() == product_type.lower()
    ]

  if filtered_df.empty:
    filtered_df = df

  filtered_matrix = tfidf.transform(filtered_df['clean_ingreds'])
  user_vec = tfidf.transform([user_query.lower()])

  similarity_scores = cosine_similarity(user_vec, filtered_matrix).flatten()
  top_indices = similarity_scores.argsort()[-top_n:][::-1]

  results = filtered_df.iloc[top_indices][
      ['product_name', 'product_url', 'product_type', 'clean_ingreds', 'price']
  ]
  return results.to_dict(orient='records')