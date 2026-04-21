import { curatedProducts } from "../data/curatedProducts";

// --- Category Baselines ---
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

// --- Ingredient Modifiers ---
const INGREDIENT_PENALTIES = {
  "palm oil": -12,
  "artificial colors": -6,
  preservatives: -5,
};

const INGREDIENT_BONUSES = {
  millet: 10,
  ragi: 8,
  "whole wheat": 8,
  organic: 10,
};

// --- Packaging Scores ---
const PACKAGING_SCORES = {
  glass: 85,
  paper: 75,
  metal: 70,
  "tetra pack": 65,
  plastic: 40,
};

// --- EcoScore Bonuses ---
const ECO_SCORE_BONUS = {
  a: 15,
  b: 10,
  c: 5,
  d: -5,
  e: -10,
};

/**
 * Calculate a Green Score (0-100) for a product.
 *
 * @param {Object} product
 * @param {string} product.category - e.g. "biscuits", "dairy"
 * @param {string[]} product.ingredients - list of ingredient keywords
 * @param {string} product.packaging - e.g. "plastic", "glass"
 * @param {string} [product.ecoScore] - optional letter grade "a"-"e"
 * @returns {number} Score clamped between 0 and 100
 */
export function calculateGreenScore(product) {
  // 1. Category baseline
  const categoryKey = (product.category || "").toLowerCase();
  const categoryScore = CATEGORY_SCORES[categoryKey] ?? 50;

  // 2. Ingredient score (start at 50, apply penalties & bonuses)
  let ingredientScore = 50;
  const ingredients = (product.ingredients || []).map((i) => i.toLowerCase());

  for (const [keyword, penalty] of Object.entries(INGREDIENT_PENALTIES)) {
    if (ingredients.some((ing) => ing.includes(keyword))) {
      ingredientScore += penalty;
    }
  }

  for (const [keyword, bonus] of Object.entries(INGREDIENT_BONUSES)) {
    if (ingredients.some((ing) => ing.includes(keyword))) {
      ingredientScore += bonus;
    }
  }

  ingredientScore = Math.max(0, Math.min(100, ingredientScore));

  // 3. Packaging score
  const packagingKey = (product.packaging || "").toLowerCase();
  const packagingScore = PACKAGING_SCORES[packagingKey] ?? 50;

  // 4. EcoScore bonus
  const ecoKey = (product.ecoScore || product.ecoscoreGrade || "").toLowerCase();
  const ecoBonus = ECO_SCORE_BONUS[ecoKey] ?? 0;

  // 5. Weighted final score
  const raw =
    categoryScore * 0.4 +
    packagingScore * 0.25 +
    ingredientScore * 0.35 +
    ecoBonus;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Get a human-readable label and Tailwind color class for a score.
 *
 * @param {number} score - Green Score 0-100
 * @returns {{ label: string, colorClass: string }}
 */
export function getScoreLabel(score) {
  if (score >= 80) {
    return { label: "Excellent", colorClass: "text-emerald-500" };
  }
  if (score >= 60) {
    return { label: "Good", colorClass: "text-green-500" };
  }
  if (score >= 40) {
    return { label: "Average", colorClass: "text-yellow-500" };
  }
  if (score >= 20) {
    return { label: "Poor", colorClass: "text-orange-500" };
  }
  return { label: "Very Poor", colorClass: "text-red-500" };
}

/**
 * Find greener alternatives from the curated product list.
 * Uses fuzzy category matching first, then category-group fallback,
 * then a global top-green fallback, always limited to 3 results.
 *
 * @param {Object} product - The product to find alternatives for
 * @returns {Object[]} Array of alternative products with their scores
 */
export function getAlternatives(product) {
  const currentScore = calculateGreenScore(product);
  const CATEGORY_GROUPS = {
    NOODLES: ["noodles", "pasta", "instant", "yippee", "maggi"],
    BISCUITS: ["biscuit", "cookie", "cracker", "goodday", "bourbon", "marie"],
    HEALTH_DRINKS: ["health", "malt", "horlicks", "bournvita", "boost"],
    SNACKS: ["snack", "chips", "namkeen", "haldiram", "lays"],
    DAIRY: ["dairy", "milk", "butter", "cheese", "amul", "paneer"],
    BEVERAGES: ["juice", "drink", "beverage", "real", "tropicana"],
  };

  const tokenize = (value = "") =>
    value
      .toLowerCase()
      .split(/[,/\s]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4);

  const getScoredProduct = (p) => ({
    ...p,
    greenScore: typeof p.greenScore === "number" ? p.greenScore : calculateGreenScore(p),
  });

  const isSameProduct = (a, b) =>
    (a.barcode && b.barcode && a.barcode === b.barcode) ||
    (a.name || "").toLowerCase() === (b.name || "").toLowerCase();

  const hasFuzzyCategoryMatch = (scanCategory, candidateCategory) => {
    const scanWords = tokenize(scanCategory);
    const candidateWords = tokenize(candidateCategory);

    if (scanWords.length === 0 || candidateWords.length === 0) {
      return false;
    }

    const scanToCandidate = scanWords.some((scanWord) =>
      candidateWords.some((candidateWord) => candidateWord.includes(scanWord))
    );
    const candidateToScan = candidateWords.some((candidateWord) =>
      scanWords.some((scanWord) => scanWord.includes(candidateWord))
    );

    return scanToCandidate || candidateToScan;
  };

  const categoryKey = (product.category || "").toLowerCase();

  let results = curatedProducts
    .filter((p) => !isSameProduct(p, product))
    .filter((p) => hasFuzzyCategoryMatch(categoryKey, (p.category || "").toLowerCase()))
    .map(getScoredProduct)
    .filter((p) => p.greenScore > currentScore);

  if (results.length === 0) {
    const scanText = `${product.name || ""} ${product.category || ""}`.toLowerCase();
    const matchedGroup = Object.values(CATEGORY_GROUPS).find((keywords) =>
      keywords.some((keyword) => scanText.includes(keyword))
    );

    if (matchedGroup) {
      results = curatedProducts
        .filter((p) => !isSameProduct(p, product))
        .filter((p) => {
          const target = `${p.name || ""} ${p.category || ""}`.toLowerCase();
          return matchedGroup.some((keyword) => target.includes(keyword));
        })
        .map(getScoredProduct)
        .filter((p) => p.greenScore > currentScore);
    }
  }

  if (results.length === 0) {
    return curatedProducts
      .filter((p) => !isSameProduct(p, product))
      .map(getScoredProduct)
      .sort((a, b) => b.greenScore - a.greenScore)
      .slice(0, 3)
      .map((p) => ({
        ...p,
        alternativesLabel: "General Green Alternatives",
      }));
  }

  return results.sort((a, b) => b.greenScore - a.greenScore).slice(0, 3);
}
