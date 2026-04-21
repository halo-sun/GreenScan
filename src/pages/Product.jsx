import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { fetchProduct } from "../lib/productFetcher";
import { db } from "../lib/firebase";
import { calculateGreenScore, getAlternatives, getScoreLabel } from "../lib/greenScore";
import GreenScoreCard from "../components/GreenScoreCard";
import ProductCard from "../components/ProductCard";

export default function Product() {
  const { barcode } = useParams();
  const [product, setProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualIngredients, setManualIngredients] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [recalcError, setRecalcError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await fetchProduct(barcode);
        if (data) {
          setProduct(data);
          setManualIngredients(data.ingredientsText || "");
          const alts = getAlternatives(data);
          setAlternatives(alts);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [barcode]);

  const shouldShowIngredientsWarning =
    product &&
    typeof product.greenScore === "number" &&
    !(product.ingredientsText || "").trim();

  async function handleRecalculateScore() {
    const trimmedIngredients = manualIngredients.trim();

    if (!trimmedIngredients || !product) {
      setRecalcError("Paste the ingredient list before recalculating.");
      return;
    }

    setRecalculating(true);
    setRecalcError("");

    const parsedIngredients = trimmedIngredients
      .toLowerCase()
      .split(/[,;()]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const nextScore = calculateGreenScore({
      ...product,
      ingredientsText: trimmedIngredients,
      ingredients: parsedIngredients,
      ecoScore: product.ecoscoreGrade || product.ecoScore || "",
    });
    const { label, colorClass } = getScoreLabel(nextScore);

    const updatedProduct = {
      ...product,
      ingredientsText: trimmedIngredients,
      ingredients: parsedIngredients,
      greenScore: nextScore,
      scoreLabel: label,
      scoreColor: colorClass,
    };

    setProduct(updatedProduct);
    setAlternatives(getAlternatives(updatedProduct));

    try {
      await setDoc(
        doc(db, "products", barcode),
        {
          ingredientsText: trimmedIngredients,
          ingredients: parsedIngredients,
          cachedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error("Failed to save manual ingredients:", err);
      setRecalcError("Score updated locally, but saving ingredients failed.");
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 px-4 max-w-2xl mx-auto text-center">
        <div className="bg-gray-900/60 p-12 rounded-3xl border border-white/10 backdrop-blur-sm">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-8">We couldn't find a product with barcode <span className="text-white font-mono">{barcode}</span> in our database.</p>
          <Link to="/scan" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
            Scan Another Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Product Image */}
        <div className="w-full md:w-1/3 aspect-square bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xl flex items-center justify-center p-6 flex-shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Info & Score */}
        <div className="w-full md:w-2/3 space-y-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-3 border border-emerald-500/20">
              {product.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{product.name}</h1>
            <p className="text-xl text-gray-400">{product.brand}</p>
          </div>

          <GreenScoreCard
            score={product.greenScore}
            label={product.scoreLabel}
            metrics={{
              Category: product.category,
              Packaging: product.packaging,
              EcoScore: (product.ecoscoreGrade || "N/A").toUpperCase(),
              Source: product.source === "openfoodfacts" ? "OpenFoodFacts" : "Curated",
            }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Ingredients
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm">
            {product.ingredientsText || "Ingredients data not available."}
          </p>
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.ingredients.map((ing, i) => (
                <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-gray-400 capitalize">
                  {ing}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900/40 p-6 rounded-3xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Packaging
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-white">{product.packaging}</div>
          </div>
          <p className="text-gray-400 text-sm mt-3">
            {product.packaging === "Plastic" && "High environmental impact. Consider alternatives with paper or glass packaging."}
            {product.packaging === "Paper" && "Lower environmental impact. Widely recyclable."}
            {product.packaging === "Glass" && "Low environmental impact. Highly recyclable."}
          </p>
        </div>
      </div>

      {shouldShowIngredientsWarning && (
        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-100">
                Ingredient data missing — score may be inaccurate
              </h3>
              <p className="text-sm text-yellow-200/80 mt-1">
                Paste the product ingredients to recalculate a more reliable Green Score.
              </p>
            </div>
          </div>

          <textarea
            value={manualIngredients}
            onChange={(e) => setManualIngredients(e.target.value)}
            placeholder="Paste ingredients here"
            className="w-full min-h-32 rounded-2xl border border-yellow-300/20 bg-black/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={handleRecalculateScore}
              disabled={recalculating}
              className="px-5 py-3 rounded-xl bg-yellow-400 text-slate-950 font-semibold hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {recalculating ? "Recalculating..." : "Recalculate Score"}
            </button>
            {recalcError && <p className="text-sm text-yellow-200">{recalcError}</p>}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="pt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Greener Alternatives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {alternatives.map((alt) => (
              <Link key={alt.barcode} to={`/product/${alt.barcode}`}>
                <ProductCard product={alt} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
