/**
 * Curated product database keyed by barcode.
 * Each product includes fields consumed by calculateGreenScore().
 */
export const curatedProductsMap = {
  // --- Popular Indian Products ---

  "8901058857386": {
    barcode: "8901058857386",
    name: "Horlicks",
    brand: "HUL",
    category: "Health Drinks",
    packaging: "Plastic",
    ingredients: ["malt extract", "sugar", "milk solids", "minerals", "vitamins", "artificial colors"],
    ingredientsText:
      "Malt Extract, Sugar, Milk Solids, Cocoa Solids, Minerals, Vitamins, Acidity Regulators, Artificial Colors",
    ecoscoreGrade: "c",
    image: "/images/horlicks.webp",
  },

  "8901063013681": {
    barcode: "8901063013681",
    name: "Parle-G",
    brand: "Parle",
    category: "Biscuits",
    packaging: "Plastic",
    ingredients: ["wheat flour", "sugar", "edible vegetable oil", "palm oil", "invert syrup", "leavening agents", "milk solids", "salt"],
    ingredientsText:
      "Wheat Flour, Sugar, Edible Vegetable Oil (Palm Oil), Invert Syrup, Leavening Agents, Milk Solids, Salt, Emulsifier, Dough Conditioner",
    ecoscoreGrade: "d",
    image: "/images/parle-g.webp",
  },

  "8901058001353": {
    barcode: "8901058001353",
    name: "Maggi 2-Minute Noodles",
    brand: "Nestlé",
    category: "Instant Noodles",
    packaging: "Plastic",
    ingredients: ["wheat flour", "palm oil", "salt", "sugar", "flavor enhancers", "preservatives", "artificial colors"],
    ingredientsText:
      "Wheat Flour, Palm Oil, Salt, Sugar, Onion Powder, Flavor Enhancers (E627, E631), Spices, Hydrolyzed Vegetable Protein, Preservatives, Artificial Colors",
    ecoscoreGrade: "d",
    image: "/images/maggi.webp",
  },

  "8901030873943": {
    barcode: "8901030873943",
    name: "Aashirvaad Atta",
    brand: "ITC",
    category: "Dairy",
    packaging: "Paper",
    ingredients: ["whole wheat", "wheat flour"],
    ingredientsText: "100% Whole Wheat Atta",
    ecoscoreGrade: "a",
    image: "/images/aashirvaad.webp",
  },

  "8901207007088": {
    barcode: "8901207007088",
    name: "Bournvita",
    brand: "Cadbury",
    category: "Health Drinks",
    packaging: "Plastic",
    ingredients: ["sugar", "cocoa solids", "malt extract", "milk solids", "caramel", "artificial colors", "vitamins"],
    ingredientsText:
      "Sugar, Cocoa Solids, Malt Extract, Liquid Glucose, Milk Solids, Caramel, Emulsifiers, Raising Agent, Artificial Colors, Vitamins",
    ecoscoreGrade: "d",
    image: "/images/bournvita.webp",
  },

  // --- Greener Alternatives (Health Drinks) ---

  "9900000000001": {
    barcode: "9900000000001",
    name: "Organic Ragi Malt",
    brand: "Pristine",
    category: "Health Drinks",
    packaging: "Paper",
    ingredients: ["organic", "ragi", "jaggery", "cardamom", "dry ginger"],
    ingredientsText:
      "Organic Ragi (Finger Millet) Flour, Jaggery, Cardamom, Dry Ginger",
    ecoscoreGrade: "a",
    image: "/images/ragi-malt.webp",
  },

  "9900000000002": {
    barcode: "9900000000002",
    name: "Millet Health Mix",
    brand: "Slurrp Farm",
    category: "Health Drinks",
    packaging: "Paper",
    ingredients: ["millet", "ragi", "jowar", "bajra", "almond", "cashew", "organic"],
    ingredientsText:
      "Organic Ragi, Jowar, Bajra, Foxtail Millet, Almonds, Cashews, Jaggery",
    ecoscoreGrade: "a",
    image: "/images/millet-mix.webp",
  },

  "9900000000003": {
    barcode: "9900000000003",
    name: "Sathu Maavu",
    brand: "Ammae",
    category: "Health Drinks",
    packaging: "Paper",
    ingredients: ["ragi", "millet", "whole wheat", "green gram", "peanut", "almond", "organic"],
    ingredientsText:
      "Organic Ragi, Wheat, Green Gram, Roasted Gram, Peanut, Almond, Cashew, Cardamom, Jaggery",
    ecoscoreGrade: "a",
    image: "/images/sathu-maavu.webp",
  },
};

/**
 * Flat array of all curated products (used by getAlternatives).
 */
export const curatedProducts = Object.values(curatedProductsMap);
