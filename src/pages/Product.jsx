import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { fetchProduct } from "../lib/productFetcher";
import { db } from "../lib/firebase";
import { calculateGreenScore, getAlternatives, getScoreLabel } from "../lib/greenScore";
import GreenScoreCard from "../components/GreenScoreCard";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";

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

function getIngredientScore(ingredients = []) {
  let score = 50;
  const normalized = ingredients.map((ingredient) => ingredient.toLowerCase());

  NEGATIVE_KEYWORDS.forEach((keyword) => {
    if (normalized.some((ingredient) => ingredient.includes(keyword))) {
      score -= keyword.includes("artificial") ? 6 : 5;
    }
  });

  POSITIVE_KEYWORDS.forEach((keyword) => {
    if (normalized.some((ingredient) => ingredient.includes(keyword))) {
      score += keyword === "organic" ? 10 : 8;
    }
  });

  return Math.max(0, Math.min(100, score));
}

function getBreakdownMetrics(product) {
  const ingredients = product.ingredients || [];

  return [
    {
      label: "Category Baseline",
      value: CATEGORY_SCORES[(product.category || "").toLowerCase()] ?? 50,
    },
    {
      label: "Ingredients",
      value: getIngredientScore(ingredients),
    },
    {
      label: "Packaging",
      value: PACKAGING_SCORES[(product.packaging || "").toLowerCase()] ?? 50,
    },
    {
      label: "EcoScore",
      value: ECO_SCORE_VALUES[(product.ecoscoreGrade || product.ecoScore || "").toLowerCase()] ?? 50,
    },
  ];
}

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
  const [compareSaved, setCompareSaved] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      try {
        const data = await fetchProduct(barcode);

        if (data) {
          setProduct(data);
          setManualIngredients(data.ingredientsText || "");
          setAlternatives(getAlternatives(data));

          const savedCompare = window.localStorage.getItem("compareProduct");
          if (savedCompare) {
            try {
              const parsed = JSON.parse(savedCompare);
              setCompareSaved(parsed.barcode === data.barcode);
            } catch {
              setCompareSaved(false);
            }
          } else {
            setCompareSaved(false);
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
    return getBreakdownMetrics(product);
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

  function handleSaveCompareProduct() {
    if (!product) return;

    window.localStorage.setItem(
      "compareProduct",
      JSON.stringify({
        barcode: product.barcode,
        name: product.name,
      }),
    );

    setCompareSaved(true);
  }

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
          <Link to="/scan" className="inline-flex px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
            Scan Another Product
          </Link>
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
                onClick={handleSaveCompareProduct}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                {compareSaved ? "Saved for Compare" : "Compare"}
              </button>
              {compareSaved && (
                <span className="inline-flex items-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  This product is ready for your next comparison scan.
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <GreenScoreCard score={product.greenScore} label={product.scoreLabel} />

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
      </div>

      {alternatives.length > 0 && (
        <div className="pt-4">
          <h2 className="mb-6 text-2xl font-bold text-[color:var(--text-primary)]">Greener Alternatives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {alternatives.map((alt) => (
              <Link key={alt.barcode} to={`/product/${alt.barcode}`}>
                <ProductCard product={alt} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </MotionDiv>
  );
}
