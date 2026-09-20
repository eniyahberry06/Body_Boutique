import React, { useState } from "react";

export default function BodyCareQuiz() {
    const [query, setQuery] = useState({ ingredients: '', category: '' });
    const [results, setResults] = useState({ recommendations: [], warnings: [] });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8001/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    desired_ingredients: Array.isArray(query.ingredients)
                        ? query.ingredients
                        : [query.ingredients],
                    product_type: query.category || null,
                }),
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            setResults({
                recommendations: data.recommendations || [],
                warnings: data.warnings || [],
            });
        } catch (err) {
            console.error(err);
            alert("Backend server connection failed. Ensure FastAPI is running on http://127.0.0.1:8000.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Header and Quiz Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h1 className="text-center text-2xl font-bold text-slate-800">The Body Boutique</h1>
                <p className="text-center text-sm text-slate-500">
                    Discover products and screen for active ingredient safety conflicts in real-time.
                </p>

                <div>
                    <label htmlFor="ingredients" className="block text-sm font-semibold text-slate-700 mb-1">
                        Ingredients or Concerns
                    </label>
                    <input
                        id="ingredients"
                        type="text"
                        placeholder="e.g. retinol, hyaluronic acid, vitamin c"
                        value={query.ingredients}
                        onChange={(e) => setQuery({ ...query, ingredients: e.target.value })}
                        required
                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800"
                    />
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1">
                        Product Category
                    </label>
                    <select
                        id="category"
                        value={query.category}
                        onChange={(e) => setQuery({ ...query, category: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                        <option value="">All Categories</option>
                        <option value="Serum">Serum</option>
                        <option value="Moisturizer">Moisturizer</option>
                        <option value="Cleanser">Cleanser</option>
                        <option value="Toner">Toner</option>
                        <option value="Treatment">Treatment</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                    {loading ? "Analyzing Ingredients..." : "Get Recommendations"}
                </button>
            </form>

            {/* Conflict Warnings */}
            {results.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2 text-amber-900">
                    <div className="font-bold text-sm">
                        ⚠️ Active Ingredient Warnings
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {results.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommended Products */}
            {results.recommendations.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">Top Matches</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.recommendations.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold uppercase px-2 py-0.5 bg-rose-50 text-rose-600 rounded">
                                            {item.product_type || 'Skincare'}
                                        </span>
                                        {item.price && (
                                            <span className="font-bold text-slate-700">${item.price}</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-800">{item.product_name}</h3>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                                        {item.clean_ingreds}
                                    </p>
                                </div>
                                {item.product_url && (
                                    <a
                                        href={item.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-rose-500 hover:underline pt-2 inline-block"
                                    >
                                        View Product →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}