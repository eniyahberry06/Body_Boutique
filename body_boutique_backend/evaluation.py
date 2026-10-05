from recommendation import df, get_recommendations, check_conflicts


def get_baseline(ingredients, product_type=None):
    filtered = df.copy()
    if product_type and product_type.lower() != 'any':
        filtered = filtered[filtered['product_type'].str.lower() == product_type.lower()]

    for ing in ingredients:
        filtered = filtered[filtered['clean_ingreds'].str.lower().str.contains(ing.lower(), regex=False)]

    return filtered.to_dict(orient='records')


test_cases = [
    {"ingredients": ["Retinol", "Glycolic Acid"], "type": "Serum"},  # Conflicting pair
    {"ingredients": ["Niacinamide", "Hyaluronic Acid"], "type": "Moisturizer"},  # Safe pair
    {"ingredients": ["Salicylic Acid"], "type": "Cleanser"},
    {"ingredients": ["Vitamin C"], "type": "Serum"},
    {"ingredients": ["Retinol", "Niacinamide"], "type": "Serum"},
    {"ingredients": ["Centella"], "type": "Toner"},
    {"ingredients": ["Glycolic Acid", "Lactic Acid"], "type": "Serum"},
    {"ingredients": ["Ceramides", "Hyaluronic Acid"], "type": "Moisturizer"},
    {"ingredients": ["Vitamin C", "Salicylic Acid"], "type": "Serum"},
    {"ingredients": ["Zinc", "Niacinamide"], "type": "Serum"},
]

# 3. Execute Evaluation
baseline_hits = 0
tfidf_hits = 0

for test in test_cases:
    b_res = get_baseline(test["ingredients"], test["type"])
    t_res = get_recommendations(" ".join(test["ingredients"]), product_type=test["type"])

    if len(b_res) > 0:
        baseline_hits += 1
    if len(t_res) > 0:
        tfidf_hits += 1

print("\n==============================================")
print("           EVALUATION RESULTS SUMMARY          ")
print("==============================================")
print(f"Total Test Cases: {len(test_cases)}")
print(f"Baseline Coverage:   {(baseline_hits / len(test_cases)) * 100:.0f}% ({baseline_hits}/{len(test_cases)})")
print(f"Our System Coverage: {(tfidf_hits / len(test_cases)) * 100:.0f}% ({tfidf_hits}/{len(test_cases)})")
print("----------------------------------------------")
print("SAFE PAIR TEST (Niacinamide + Hyaluronic Acid):")
print(f"  Conflict Warning: {check_conflicts(['Niacinamide', 'Hyaluronic Acid'])}")
print(f"  Top Product:      {get_recommendations('Niacinamide Hyaluronic Acid', top_n=1)[0]['product_name']}")
print("----------------------------------------------")
print("CONFLICT PAIR TEST (Retinol + Glycolic Acid):")
print(f"  Conflict Warning: {check_conflicts(['Retinol', 'Glycolic Acid'])[0]}")
print("==============================================\n")