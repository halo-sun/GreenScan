import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProduct } from "../lib/productFetcher";
import GreenScoreCard from "../components/GreenScoreCard";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const PACKAGING_RANK = {
  glass: 4,
  paper: 3,
  metal: 3,
  "tetra pack": 2,
  plastic: 1,
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

const POSITIVE_KEYWORDS = ["organic", "millet", "ragi", "whole wheat", "natural flavours", "natural flavors"];

function getIngredientQuality(product) {
  const ingredients = (product.ingredientsText || "")
    .toLowerCase()
    .split(/[,;()]/)
    .map((item) => item.trim())
    .filter(Boolean);

  let score = 50;

  ingredients.forEach((ingredient) => {
    if (NEGATIVE_KEYWORDS.some((keyword) => ingredient.includes(keyword))) score -= 7;
    if (POSITIVE_KEYWORDS.some((keyword) => ingredient.includes(keyword))) score += 8;
  });

  return Math.max(0, Math.min(100, score));
}

function getComparisonTone(leftValue, rightValue) {
  if (leftValue === rightValue) {
    return {
      left: "border-white/10 bg-white/5 text-[color:var(--text-primary)]",
      right: "border-white/10 bg-white/5 text-[color:var(--text-primary)]",
    };
  }

  return leftValue > rightValue
    ? {
        left: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        right: "border-red-400/30 bg-red-500/10 text-red-300",
      }
    : {
        left: "border-red-400/30 bg-red-500/10 text-red-300",
        right: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      };
}

function ComparisonRow({ label, leftValue, rightValue, leftTone, rightTone }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr] items-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{label}</p>
      <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${leftTone}`}>{leftValue}</div>
      <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${rightTone}`}>{rightValue}</div>
    </div>
  );
}

export default function Compare() {
  const MotionDiv = motion.div;
  const [searchParams] = useSearchParams();
  const [leftProduct, setLeftProduct] = useState(null);
  const [rightProduct, setRightProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const leftBarcode = searchParams.get("left");
  const rightBarcode = searchParams.get("right");

  useEffect(() => {
    async function loadProducts() {
      if (!leftBarcode || !rightBarcode) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [left, right] = await Promise.all([
          fetchProduct(leftBarcode),
          fetchProduct(rightBarcode),
        ]);

        setLeftProduct(left);
        setRightProduct(right);
      } catch (error) {
        console.error("Failed to load comparison products:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [leftBarcode, rightBarcode]);

  const comparisons = useMemo(() => {
    if (!leftProduct || !rightProduct) return null;

    const scoreTone = getComparisonTone(leftProduct.greenScore ?? 0, rightProduct.greenScore ?? 0);
    const packagingTone = getComparisonTone(
      PACKAGING_RANK[(leftProduct.packaging || "").toLowerCase()] ?? 0,
      PACKAGING_RANK[(rightProduct.packaging || "").toLowerCase()] ?? 0,
    );
    const ingredientsTone = getComparisonTone(getIngredientQuality(leftProduct), getIngredientQuality(rightProduct));

    return {
      scoreTone,
      packagingTone,
      ingredientsTone,
    };
  }, [leftProduct, rightProduct]);

  if (loading) {
    return (
      <MotionDiv
        {...PAGE_TRANSITION}
        className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto flex items-center justify-center"
      >
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </MotionDiv>
    );
  }

  if (!leftProduct || !rightProduct) {
    return (
      <MotionDiv
        {...PAGE_TRANSITION}
        className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto"
      >
        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-10 text-center">
          <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">Comparison unavailable</h1>
          <p className="mt-3 text-[color:var(--text-muted)]">
            Scan another product after saving one for comparison, or open this page with both product barcodes.
          </p>
          <Link
            to="/scan"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Go to Scan
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
      <div>
        <h1 className="text-4xl font-bold text-[color:var(--text-primary)]">Product Compare</h1>
        <p className="mt-2 text-[color:var(--text-muted)]">
          Side-by-side view of score, packaging, and ingredient quality for both products.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[leftProduct, rightProduct].map((product) => (
          <div
            key={product.barcode}
            className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-5"
          >
            <div className="aspect-[4/3] rounded-[2rem] bg-white border border-[color:var(--border-soft)] overflow-hidden flex items-center justify-center p-6">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-[color:var(--text-muted)]">No image</div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">{product.name}</h2>
              <p className="mt-1 text-[color:var(--text-muted)]">{product.brand}</p>
            </div>

            <GreenScoreCard score={product.greenScore} label={product.scoreLabel} />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
        <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Comparison Table</h2>

        <ComparisonRow
          label="Score"
          leftValue={`${leftProduct.greenScore}/100`}
          rightValue={`${rightProduct.greenScore}/100`}
          leftTone={comparisons.scoreTone.left}
          rightTone={comparisons.scoreTone.right}
        />
        <ComparisonRow
          label="Packaging"
          leftValue={leftProduct.packaging}
          rightValue={rightProduct.packaging}
          leftTone={comparisons.packagingTone.left}
          rightTone={comparisons.packagingTone.right}
        />
        <ComparisonRow
          label="Ingredients"
          leftValue={`${getIngredientQuality(leftProduct)}/100 quality`}
          rightValue={`${getIngredientQuality(rightProduct)}/100 quality`}
          leftTone={comparisons.ingredientsTone.left}
          rightTone={comparisons.ingredientsTone.right}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{leftProduct.name} Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {(leftProduct.ingredientsText || "Ingredients unavailable")
              .split(/[,;]+/)
              .map((item) => item.trim())
              .filter(Boolean)
              .map((ingredient) => (
                <span key={`${leftProduct.barcode}-${ingredient}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[color:var(--text-primary)]">
                  {ingredient}
                </span>
              ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-4">
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{rightProduct.name} Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {(rightProduct.ingredientsText || "Ingredients unavailable")
              .split(/[,;]+/)
              .map((item) => item.trim())
              .filter(Boolean)
              .map((ingredient) => (
                <span key={`${rightProduct.barcode}-${ingredient}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[color:var(--text-primary)]">
                  {ingredient}
                </span>
              ))}
          </div>
        </div>
      </div>
    </MotionDiv>
  );
}
