import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

df = pd.read_csv("data/skincare_products_clean.csv")

df['clean_ingreds'] = df['clean_ingreds'].fillna('')

# 1. Initialize Vectorizer
tfidf = TfidfVectorizer(
    tokenizer=lambda x: [i.strip() for i in x.split(',')], token_pattern=None
)

# 2. FIX: Fit the vectorizer on your dataset's ingredients!
tfidf_matrix = tfidf.fit_transform(df['clean_ingreds'])

CONFLICT_RULES = {
    "retinol": ["glycolic acid", "salicylic acid", "lactic acid", "vitamin c"],
    "vitamin c": ["retinol", "glycolic acid", "salicylic acid"],
    "glycolic acid": ["retinol", "vitamin c"],
    "salicylic acid": ["retinol", "vitamin c"],
}


def check_conflicts(ingredient_list):
  found_conflicts = []
  text = " ".join(ingredient_list).lower()

  for active, incompatibles in CONFLICT_RULES.items():
    if active in text:
      for bad_match in incompatibles:
        if bad_match in text:
          found_conflicts.append(
              f"Conflict detected: Avoid pairing {active.title()} with"
              f" {bad_match.title()}."
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