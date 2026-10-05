import React, { useState } from 'react';

const CONCERN_OPTIONS = [
    'Acne',
    'Redness',
    'Dryness',
    'Eczema',
    'Fine Lines',
    'Hyperpigmentation',
    'Sensitive Skin',
    'Oil Control',
];

export default function App() {
    const [ingredientInput, setIngredientInput] = useState('');
    const [desiredIngredients, setDesiredIngredients] = useState(['Retinol', 'Niacinamide']);
    const [selectedConcerns, setSelectedConcerns] = useState(['Redness', 'Acne']);
    const [productType, setProductType] = useState('Serum');
    const [scentPreference, setScentPreference] = useState('unscented');
    const [texturePreference, setTexturePreference] = useState('gel');

    const [recommendations, setRecommendations] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggleConcern = (concern) => {
        if (selectedConcerns.includes(concern)) {
            setSelectedConcerns(selectedConcerns.filter((c) => c !== concern));
        } else {
            setSelectedConcerns([...selectedConcerns, concern]);
        }
    };

    const handleAddIngredient = (e) => {
        e.preventDefault();
        if (ingredientInput.trim() && !desiredIngredients.includes(ingredientInput.trim())) {
            setDesiredIngredients([...desiredIngredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const removeIngredient = (ing) => {
        setDesiredIngredients(desiredIngredients.filter((i) => i !== ing));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            desired_ingredients: desiredIngredients,
            skin_concerns: selectedConcerns,
            product_type: productType !== 'any' ? productType : null,
            scent_preference: scentPreference,
            texture_preference: texturePreference,
        };

        try {
            const response = await fetch('http://127.0.0.1:8001/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();
            setRecommendations(data.recommendations || []);
            setWarnings(data.warnings || []);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Backend server connection failed. Ensure FastAPI is running on http://127.0.0.1:8001.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-pink-50/50 p-6 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-pink-600 tracking-tight">The Body Boutique</h1>
                    <p className="text-gray-600 mt-2">Tailored skincare recommendations with AI ingredient analysis</p>
                </header>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 mb-8 space-y-6">
                    {/* Active Ingredients Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Desired Active Ingredients:</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={ingredientInput}
                                onChange={(e) => setIngredientInput(e.target.value)}
                                placeholder="e.g. Salicylic Acid, Vitamin C"
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                            <button
                                onClick={handleAddIngredient}
                                type="button"
                                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {desiredIngredients.map((ing) => (
                                <span key={ing} className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium">
                  {ing}
                                    <button type="button" onClick={() => removeIngredient(ing)} className="hover:text-pink-900 font-bold">×</button>
                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Skin Concerns:</label>
                        <div className="flex flex-wrap gap-2">
                            {CONCERN_OPTIONS.map((concern) => {
                                const isSelected = selectedConcerns.includes(concern);
                                return (
                                    <button
                                        key={concern}
                                        type="button"
                                        onClick={() => toggleConcern(concern)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                                            isSelected
                                                ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-pink-300'
                                        }`}
                                    >
                                        {concern}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-pink-50 pt-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Product Type:</label>
                            <select
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-pink-400"
                            >
                                <option value="any">Any Category</option>
                                <option value="Serum">Serum</option>
                                <option value="Moisturizer">Moisturizer</option>
                                <option value="Cleanser">Cleanser</option>
                                <option value="Toner">Toner</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Fragrance / Smell:</label>
                            <select
                                value={scentPreference}
                                onChange={(e) => setScentPreference(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-pink-400"
                            >
                                <option value="any">No Preference</option>
                                <option value="unscented">Unscented / Fragrance-Free</option>
                                <option value="scented">Scented / Fresh</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Texture Preference:</label>
                            <select
                                value={texturePreference}
                                onChange={(e) => setTexturePreference(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-pink-400"
                            >
                                <option value="any">No Preference</option>
                                <option value="gel">Gel (Lightweight)</option>
                                <option value="cream">Cream (Rich)</option>
                                <option value="lotion">Lotion (Balanced)</option>
                                <option value="oil">Oil / Balm</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Analyzing Ingredients & Formulations...' : 'Get Recommendations'}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6">
                        <h3 className="font-bold text-sm mb-1">⚠️ Safety & Routine Warnings:</h3>
                        <ul className="list-disc pl-5 text-xs space-y-1">
                            {warnings.map((warn, index) => (
                                <li key={index}>{warn}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((item, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold text-pink-500 uppercase tracking-wider">{item.product_type || 'Skincare'}</span>
                                    {item.price && <span className="text-xs font-bold text-gray-500">{item.price}</span>}
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2">{item.product_name}</h3>

                                {/* AI / Rule Engine Explanation Callout Box */}
                                <div className="bg-pink-50/80 border border-pink-100 rounded-xl p-3 my-3">
                                    <p className="text-xs font-bold text-pink-700 mb-0.5">Why this product?</p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        {item.match_reason || 'Matches your target ingredients and skin profile.'}
                                    </p>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2">
                                    <span className="font-semibold text-gray-600">Ingredients:</span> {item.clean_ingreds}
                                </p>
                            </div>

                            {item.product_url && (
                                <a
                                    href={item.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 text-center text-xs font-bold text-pink-600 hover:text-pink-700 border border-pink-200 py-2 rounded-lg block transition"
                                >
                                    View Product Details
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}