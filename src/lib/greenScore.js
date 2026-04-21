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

// --- Additives Penalties ---
const HARMFUL_ADDITIVES = ["e102", "e110", "e122", "e124", "e211", "e621", "e951"];
const CONTROVERSIAL_ADDITIVES = ["e407", "e412", "e415", "e471", "e472"];

// --- Labels Bonuses ---
const LABELS_BONUS = {
  "en:organic": 8,
  "en:fairtrade": 5,
  "en:vegan": 4,
  "en:no-additives": 6,
  "en:no-preservatives": 4,
};

// --- NutriScore Bonus ---
const NUTRI_SCORE_BONUS = {
  a: 8,
  b: 4,
  c: 0,
  d: -4,
  e: -8,
};

/**
 * Calculate a Green Score (0-100) for a product.
 *
 * @param {Object} product
 * @param {string} product.category - e.g. "biscuits", "dairy"
 * @param {string[]} product.ingredients - list of ingredient keywords
 * @param {string} product.packaging - e.g. "plastic", "glass"
 * @param {string} [product.ecoScore] - optional letter grade "a"-"e"
 * @param {string[]} product.additivesTags - list of additive codes
 * @param {string[]} product.labelsTags - list of label tags
 * @param {string} product.nutriscoreGrade - optional letter grade "a"-"e"
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

  // 4. Additives penalty
  let additivesPenalty = 0;
  const additivesTags = (product.additivesTags || []).map((a) => a.toLowerCase());

  for (const additive of additivesTags) {
    if (HARMFUL_ADDITIVES.includes(additive)) {
      additivesPenalty -= 5;
    } else if (CONTROVERSIAL_ADDITIVES.includes(additive)) {
      additivesPenalty -= 2;
    }
  }

  // Cap additives penalty at -20
  additivesPenalty = Math.max(-20, additivesPenalty);
  const additivesScore = 100 + additivesPenalty;

  // 5. Labels bonus
  let labelBonus = 0;
  const labelsTags = (product.labelsTags || []).map((l) => l.toLowerCase());

  for (const [label, bonus] of Object.entries(LABELS_BONUS)) {
    if (labelsTags.includes(label)) {
      labelBonus += bonus;
    }
  }

  const labelsScore = 50 + labelBonus;

  // 6. EcoScore bonus
  const ecoKey = (product.ecoScore || product.ecoscoreGrade || "").toLowerCase();
  const ecoBonus = ECO_SCORE_BONUS[ecoKey] ?? 0;

  // 7. NutriScore bonus
  const nutriKey = (product.nutriscoreGrade || "").toLowerCase();
  const nutriBonus = NUTRI_SCORE_BONUS[nutriKey] ?? 0;

  // 8. Weighted final score
  const raw =
    categoryScore * 0.35 +
    packagingScore * 0.25 +
    ingredientScore * 0.25 +
    additivesScore * 0.10 +
    labelsScore * 0.05 +
    ecoBonus +
    nutriBonus;

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
 * Get metrics breakdown for displaying individual score components.
 *
 * @param {Object} product
 * @returns {Array<{ label: string, value: number }>}
 */
export function getMetricsBreakdown(product) {
  const categoryKey = (product.category || "").toLowerCase();
  const categoryScore = CATEGORY_SCORES[categoryKey] ?? 50;

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

  const packagingKey = (product.packaging || "").toLowerCase();
  const packagingScore = PACKAGING_SCORES[packagingKey] ?? 50;

  let additivesPenalty = 0;
  const additivesTags = (product.additivesTags || []).map((a) => a.toLowerCase());
  for (const additive of additivesTags) {
    if (HARMFUL_ADDITIVES.includes(additive)) {
      additivesPenalty -= 5;
    } else if (CONTROVERSIAL_ADDITIVES.includes(additive)) {
      additivesPenalty -= 2;
    }
  }
  additivesPenalty = Math.max(-20, additivesPenalty);
  const additivesScore = 100 + additivesPenalty;

  let labelBonus = 0;
  const labelsTags = (product.labelsTags || []).map((l) => l.toLowerCase());
  for (const [label, bonus] of Object.entries(LABELS_BONUS)) {
    if (labelsTags.includes(label)) {
      labelBonus += bonus;
    }
  }
  const labelsScore = 50 + labelBonus;

  const ecoKey = (product.ecoScore || product.ecoscoreGrade || "").toLowerCase();
  const ecoScore = 50 + (ECO_SCORE_BONUS[ecoKey] ?? 0);

  const nutriKey = (product.nutriscoreGrade || "").toLowerCase();
  const nutriScore = 50 + (NUTRI_SCORE_BONUS[nutriKey] ?? 0);

  return [
    { label: "Category", value: categoryScore },
    { label: "Packaging", value: packagingScore },
    { label: "Ingredients", value: ingredientScore },
    { label: "Additives", value: additivesScore },
    { label: "Labels", value: labelsScore },
    { label: "EcoScore", value: ecoScore },
    { label: "NutriScore", value: nutriScore },
  ];
}
