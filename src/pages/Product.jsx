import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { fetchAlternatives, fetchProduct } from "../lib/productFetcher";
import { calculateGreenScore, getScoreLabel, getMetricsBreakdown } from "../lib/greenScore";
import GreenScoreCard from "../components/GreenScoreCard";
import SkeletonCard from "../components/SkeletonCard";
import { db } from "../lib/firebase";

function AlternativeCard({ product, currentProduct }) {
  const [expanded, setExpanded] = useState(false);
  const { label, colorClass } = getScoreLabel(product.greenScore ?? 0);

  const badgeBg = {
    "text-emerald-500": "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    "text-green-500": "bg-green-500/15 border-green-500/30 text-green-400",
    "text-yellow-500": "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
    "text-orange-500": "bg-orange-500/15 border-orange-500/30 text-orange-400",
    "text-red-500": "bg-red-500/15 border-red-500/30 text-red-400",
  };
  const badgeClass = badgeBg[colorClass] || badgeBg["text-yellow-500"];

  const currentScore = currentProduct.greenScore ?? 0;
  const altScore = product.greenScore ?? 0;
  const scoreDiff = altScore - currentScore;

  const reasons = [];
  if (product.packaging && currentProduct.packaging) {
    const packagingRank = { glass: 4, paper: 3, metal: 3, "tetra pack": 2, plastic: 1 };
    const currentRank = packagingRank[(currentProduct.packaging || "").toLowerCase()] ?? 1;
    const altRank = packagingRank[(product.packaging || "").toLowerCase()] ?? 1;
    if (altRank > currentRank) {
      reasons.push(`Better packaging: ${product.packaging} vs ${currentProduct.packaging}`);
    }
  }
  if (product.ecoscoreGrade && currentProduct.ecoscoreGrade) {
    const ecoRank = { a: 5, b: 4, c: 3, d: 2, e: 1 };
    const currentEco = ecoRank[(currentProduct.ecoscoreGrade || "").toLowerCase()] ?? 3;
    const altEco = ecoRank[(product.ecoscoreGrade || "").toLowerCase()] ?? 3;
    if (altEco > currentEco) {
      reasons.push(`Higher EcoScore: ${product.ecoscoreGrade.toUpperCase()} vs ${currentProduct.ecoscoreGrade.toUpperCase()}`);
    }
  }
  if (scoreDiff > 5) {
    reasons.push(`Higher green score: ${altScore} vs ${currentScore}`);
  }

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="relative h-44 bg-gray-800/50 overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm ${badgeClass}`}>
          {product.greenScore ?? "—"}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm truncate group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-xs mt-1 truncate">{product.brand}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-md">{product.category}</span>
          <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-xs text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? "Hide" : "Why"} greener?
          <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && reasons.length > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
            <ul className="space-y-1">
              {reasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-emerald-300 flex items-start gap-1">
                  <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const NEGATIVE_KEYWORDS = [
  "palm oil",
  "preservatives",
  "artificial colors",
  "artificial colours",
  "artificial flavours",
  "artificial flavors",
  "emulsifiers",
];

const POSITIVE_KEYWORDS = [
  "organic",
  "millet",
  "ragi",
  "whole wheat",
  "natural flavours",
  "natural flavors",
];

const CATEGORY_SCORES = {
  biscuits: 55,
  "soft drinks": 30,
  dairy: 50,
  "health drinks": 60,
  snacks: 45,
  "instant noodles": 35,
  "tea/coffee": 70,
  "personal care": 65,
};

const PACKAGING_SCORES = {
  glass: 85,
  paper: 75,
  metal: 70,
  "tetra pack": 65,
  plastic: 40,
};

const ECO_SCORE_VALUES = {
  a: 90,
  b: 75,
  c: 60,
  d: 35,
  e: 20,
};

function getIngredientTone(ingredient) {
  const normalized = ingredient.toLowerCase();

  if (NEGATIVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  if (POSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  return "border-white/10 bg-white/5 text-[color:var(--text-muted)]";
}

export default function Product() {
  const MotionDiv = motion.div;
  const { barcode } = useParams();
  const [product, setProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualIngredients, setManualIngredients] = useState("");
  const [recalculating, setRecalculating] = useState(false);
  const [recalcError, setRecalcError] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      try {
        const data = await fetchProduct(barcode);

        if (data) {
          setProduct(data);
          setManualIngredients(data.ingredientsText || "");
          const alts = await fetchAlternatives(data);
          setAlternatives(alts);

          const savedCompare = window.localStorage.getItem("compareProduct");
          if (savedCompare) {
            try {
              const parsed = JSON.parse(savedCompare);
              setCompareMode(parsed.barcode === data.barcode);
            } catch {
              setCompareMode(false);
            }
          } else {
            setCompareMode(false);
          }
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

  const ingredientTags = useMemo(() => {
    const source = (product?.ingredientsText || "").split(/[,;]+/).map((item) => item.trim()).filter(Boolean);
    return source;
  }, [product?.ingredientsText]);

  const breakdownMetrics = useMemo(() => {
    if (!product) return [];
    return getMetricsBreakdown(product);
  }, [product]);

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
    const alternatives = await fetchAlternatives(updatedProduct);
    setAlternatives(alternatives);

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

  function handleToggleCompare() {
    if (!product) return;

    if (compareMode) {
      window.localStorage.removeItem("compareProduct");
      setCompareMode(false);
    } else {
      window.localStorage.setItem(
        "compareProduct",
        JSON.stringify({
          barcode: product.barcode,
          name: product.name,
        }),
      );
      setCompareMode(true);
    }
  }

  function clearCompareFromBanner() {
    window.localStorage.removeItem("compareProduct");
    setCompareMode(false);
  }

  useEffect(() => {
    window.clearCompareFromProduct = clearCompareFromBanner;
    return () => {
      delete window.clearCompareFromProduct;
    };
  }, []);

  if (loading) {
    return <SkeletonCard />;
  }

  if (!product) {
    return (
      <MotionDiv
        {...PAGE_TRANSITION}
        className="min-h-screen pt-32 px-4 max-w-2xl mx-auto text-center"
      >
        <div className="p-12 rounded-3xl border border-[color:var(--border-soft)] backdrop-blur-sm bg-[color:var(--surface-card)]/85">
          <svg className="w-20 h-20 mx-auto mb-6 text-[color:var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="mb-4 text-3xl font-bold text-[color:var(--text-primary)]">Product Not Found</h1>
          <p className="mb-8 text-[color:var(--text-muted)]">
            We couldn&apos;t find a product with barcode <span className="font-mono text-[color:var(--text-primary)]">{barcode}</span> in our database.
          </p>
          <div className="space-y-4">
            <a
              href={`https://world.openfoodfacts.org/product/${barcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Add this product on OpenFoodFacts
            </a>
            <p className="text-sm text-[color:var(--text-muted)]">
              Once it&apos;s added there, it should appear in GreenScan within 24 hours.
            </p>
            <Link to="/scan" className="inline-flex px-6 py-3 bg-[color:var(--surface-muted)] text-[color:var(--text-primary)] rounded-xl hover:opacity-90 transition-opacity font-medium">
              Scan Another Product
            </Link>
          </div>
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      {...PAGE_TRANSITION}
      className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="aspect-square overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-white shadow-xl flex items-center justify-center p-8">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <svg className="w-24 h-24 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                {product.packaging}
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-300">
                {product.source === "openfoodfacts" ? "OpenFoodFacts" : "Curated"}
              </span>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)]">{product.name}</h1>
              <p className="mt-2 text-xl text-[color:var(--text-muted)]">{product.brand}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleToggleCompare}
                className={`inline-flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  compareMode
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {compareMode ? "Remove from Compare" : "Compare"}
              </button>
              {compareMode && (
                <span className="inline-flex items-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  Added to compare
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <GreenScoreCard score={product.greenScore} label={product.scoreLabel} />
            </div>
            <div className="flex flex-col gap-2">
              {product.ecoscoreGrade && (
                <div className={`px-4 py-2 rounded-xl text-lg font-bold border backdrop-blur-sm ${
                  product.ecoscoreGrade === "a" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                  product.ecoscoreGrade === "b" ? "bg-green-500/15 border-green-500/30 text-green-400" :
                  product.ecoscoreGrade === "c" ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" :
                  product.ecoscoreGrade === "d" ? "bg-orange-500/15 border-orange-500/30 text-orange-400" :
                  "bg-red-500/15 border-red-500/30 text-red-400"
                }`}>
                  Eco: {product.ecoscoreGrade.toUpperCase()}
                </div>
              )}
              {product.nutriscoreGrade && (
                <div className={`px-4 py-2 rounded-xl text-lg font-bold border backdrop-blur-sm ${
                  product.nutriscoreGrade === "a" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                  product.nutriscoreGrade === "b" ? "bg-green-500/15 border-green-500/30 text-green-400" :
                  product.nutriscoreGrade === "c" ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" :
                  product.nutriscoreGrade === "d" ? "bg-orange-500/15 border-orange-500/30 text-orange-400" :
                  "bg-red-500/15 border-red-500/30 text-red-400"
                }`}>
                  Nutri: {product.nutriscoreGrade.toUpperCase()}
                </div>
              )}
              {product.novaGroup && (
                <div className={`px-4 py-2 rounded-xl text-lg font-bold border backdrop-blur-sm ${
                  product.novaGroup === 1 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                  product.novaGroup === 2 ? "bg-green-500/15 border-green-500/30 text-green-400" :
                  product.novaGroup === 3 ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400" :
                  "bg-red-500/15 border-red-500/30 text-red-400"
                }`}>
                  Nova: {product.novaGroup}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Metrics Breakdown</h2>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                A quick view of the category, ingredient, packaging, and EcoScore inputs driving the Green Score.
              </p>
            </div>

            <div className="space-y-4">
              {breakdownMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[color:var(--text-primary)]">{metric.label}</span>
                    <span className="text-[color:var(--text-muted)]">{metric.value}/100</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-yellow-300"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {shouldShowIngredientsWarning && (
        <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-100">Ingredient data missing — score may be inaccurate</h3>
              <p className="mt-1 text-sm text-yellow-200/80">
                Paste the product ingredients to recalculate a more reliable Green Score.
              </p>
            </div>
          </div>

          <textarea
            value={manualIngredients}
            onChange={(event) => setManualIngredients(event.target.value)}
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Ingredients</h2>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              Tags are color-coded by common positive and negative sustainability signals.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">
            {product.ingredientsText || "Ingredients data not available."}
          </p>

          {ingredientTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ingredientTags.map((ingredient) => (
                <span
                  key={ingredient}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getIngredientTone(ingredient)}`}
                >
                  {ingredient}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Packaging Snapshot</h2>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/30 px-4 py-4">
            <span className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Format</span>
            <span className="text-lg font-semibold text-[color:var(--text-primary)]">{product.packaging}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/30 px-4 py-4">
            <span className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">EcoScore</span>
            <span className="text-lg font-semibold text-[color:var(--text-primary)]">
              {(product.ecoscoreGrade || "n/a").toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-[color:var(--text-muted)]">
            {product.packaging === "Plastic" && "High environmental impact. Consider alternatives with paper or glass packaging."}
            {product.packaging === "Paper" && "Lower environmental impact. Widely recyclable."}
            {product.packaging === "Glass" && "Low environmental impact. Highly recyclable."}
            {product.packaging === "Tetra Pack" && "Moderate impact. Better than plastic in some cases, but recycling access varies."}
          </p>
        </div>

        {product.displayNutrition && (
          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Nutrition Facts</h2>
            <p className="text-sm text-[color:var(--text-muted)]">Per 100g</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Energy", key: "calories", unit: "kcal", high: null },
                { label: "Fat", key: "fat", unit: "g", high: 20 },
                { label: "Saturated Fat", key: "saturatedFat", unit: "g", high: 5 },
                { label: "Sugar", key: "sugar", unit: "g", high: 22.5 },
                { label: "Salt", key: "salt", unit: "g", high: 1.5 },
                { label: "Protein", key: "protein", unit: "g", high: null },
                { label: "Fiber", key: "fiber", unit: "g", high: null },
              ].map(({ label, key, unit, high }) => {
                const value = product.displayNutrition[key];
                if (value === null || value === undefined) return null;
                let colorClass = "text-[color:var(--text-primary)]";
                if (high !== null && value > high) colorClass = "text-red-400";
                else if (high !== null && value > high * 0.5) colorClass = "text-amber-400";
                else if (high !== null) colorClass = "text-emerald-400";
                return (
                  <div key={key} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                    <span className="text-sm text-[color:var(--text-muted)]">{label}</span>
                    <span className={`text-sm font-semibold ${colorClass}`}>{value}{unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {product.labelsTags && product.labelsTags.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Certifications & Labels</h2>
            <div className="flex flex-wrap gap-2">
              {product.labelsTags.map((label) => {
                const labelNames = {
                  "en:organic": "Organic",
                  "en:fairtrade": "Fair Trade",
                  "en:vegan": "Vegan",
                  "en:vegetarian": "Vegetarian",
                  "en:no-additives": "No Additives",
                  "en:no-preservatives": "No Preservatives",
                  "en:gluten-free": "Gluten Free",
                  "en:low-sugar": "Low Sugar",
                  "en:low-fat": "Low Fat",
                  "en:natural": "Natural",
                  "en:sustainable": "Sustainable",
                  "en:rspo-certified-sustainable-palm-oil": "Sustainable Palm Oil",
                };
                const displayName = labelNames[label.toLowerCase()] || label.replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
                return (
                  <span key={label} className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
                    {displayName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {product.additivesTags && product.additivesTags.length > 0 && (
          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Additives</h2>
            <div className="flex flex-wrap gap-2">
              {product.additivesTags.map((additive) => {
                const additiveNames = {
                  "e102": "Tartrazine",
                  "e110": "Sunset Yellow",
                  "e122": "Carmoisine",
                  "e124": "Ponceau 4R",
                  "e211": "Sodium Benzoate",
                  "e621": "MSG",
                  "e951": "Aspartame",
                  "e407": "Carrageenan",
                  "e412": "Guar Gum",
                  "e415": "Xanthan Gum",
                  "e471": "Mono- and Diglycerides",
                  "e472": "Esters of Mono/Diglycerides",
                  "e160a": "Carotenes",
                  "e160c": "Paprika Extract",
                  "e300": "Vitamin C",
                  "e306": "Tocopherols",
                  "e322": "Lecithins",
                  "e330": "Citric Acid",
                  "e331": "Sodium Citrate",
                  "e332": "Potassium Citrate",
                  "e400": "Alginic Acid",
                  "e401": "Sodium Alginate",
                  "e440": "Pectin",
                  "e500": "Sodium Carbonates",
                  "e501": "Potassium Carbonates",
                  "e503": "Ammonium Carbonates",
                };
                const harmful = ["e102", "e110", "e122", "e124", "e211", "e621", "e951"];
                const controversial = ["e407", "e412", "e415", "e471", "e472"];
                const addCode = additive.toLowerCase();
                let badgeClass = "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
                if (harmful.includes(addCode)) badgeClass = "border-red-400/20 bg-red-500/10 text-red-300";
                else if (controversial.includes(addCode)) badgeClass = "border-amber-400/20 bg-amber-500/10 text-amber-300";
                return (
                  <span key={additive} className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${badgeClass}`}>
                    {additive.toUpperCase()}: {additiveNames[addCode] || "Additive"}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
          <h2 className="mb-6 text-2xl font-bold text-[color:var(--text-primary)]">Greener Alternatives</h2>
          {alternatives.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {alternatives.map((alt) => (
                <Link key={alt.barcode} to={`/product/${alt.barcode}`}>
                  <AlternativeCard product={alt} currentProduct={product} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 text-center">
              <p className="text-[color:var(--text-muted)]">
                No alternatives found yet.
              </p>
            </div>
          )}
        </div>

      <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
        <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Product Data</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm text-[color:var(--text-muted)]">
            Source: <span className="text-[color:var(--text-primary)] font-medium">{product.source === "openfoodfacts" ? "OpenFoodFacts" : product.source === "curated" ? "Curated" : "Firestore Cache"}</span>
          </span>
          {product.cachedAt && (
            <span className="text-sm text-[color:var(--text-muted)]">
              Updated: <span className="text-[color:var(--text-primary)] font-medium">{new Date(product.cachedAt.seconds * 1000).toLocaleDateString()}</span>
            </span>
          )}
        </div>
        <a
          href={`https://world.openfoodfacts.org/product/${product.barcode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Improve this product on OpenFoodFacts
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <Link
        to="/scan"
        className="fixed bottom-24 right-4 z-40 inline-flex items-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-colors hover:bg-emerald-500 md:bottom-8 md:right-8"
      >
        Scan Again
      </Link>
    </MotionDiv>
  );
}
