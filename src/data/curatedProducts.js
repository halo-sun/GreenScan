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

  "8901725181009": {
    barcode: "8901725181009",
    name: "Yippee Noodles",
    brand: "Sunfeast",
    category: "Instant Noodles",
    packaging: "Plastic",
    ingredients: ["wheat flour", "refined wheat", "salt", "tapioca starch", "artificial flavours", "palm oil", "preservatives"],
    ingredientsText:
      "Wheat Flour, Refined Wheat, Salt, Tapioca Starch, Artificial Flavours, Palm Oil, Preservatives",
    ecoscoreGrade: "d",
    image: "/images/yippee-noodles.webp",
  },

  "8901725131004": {
    barcode: "8901725131004",
    name: "Sunfeast Dark Fantasy",
    brand: "Sunfeast",
    category: "Biscuits",
    packaging: "Plastic",
    ingredients: ["refined wheat flour", "sugar", "cocoa", "palm oil", "artificial flavours", "emulsifiers"],
    ingredientsText:
      "Refined Wheat Flour, Sugar, Cocoa, Palm Oil, Artificial Flavours, Emulsifiers",
    ecoscoreGrade: "d",
    image: "/images/sunfeast-dark-fantasy.webp",
  },

  "4902430": {
    barcode: "4902430",
    name: "Lay's Classic Salted",
    brand: "Lay's",
    category: "Snacks",
    packaging: "Plastic",
    ingredients: ["potatoes", "vegetable oil", "salt"],
    ingredientsText:
      "Potatoes, Vegetable Oil, Salt",
    ecoscoreGrade: "c",
    image: "/images/lays-classic-salted.webp",
  },

  "8901058000011": {
    barcode: "8901058000011",
    name: "Amul Butter",
    brand: "Amul",
    category: "Dairy",
    packaging: "Paper",
    ingredients: ["pasteurised cream", "common salt"],
    ingredientsText:
      "Pasteurised Cream, Common Salt",
    ecoscoreGrade: "b",
    image: "/images/amul-butter.webp",
  },

  "8901584020015": {
    barcode: "8901584020015",
    name: "Tata Tea Premium",
    brand: "Tata Tea",
    category: "Tea/Coffee",
    packaging: "Paper",
    ingredients: ["black tea", "natural flavours"],
    ingredientsText:
      "Black Tea, Natural Flavours",
    ecoscoreGrade: "b",
    image: "/images/tata-tea-premium.webp",
  },

  "8901234567890": {
    barcode: "8901234567890",
    name: "Lifebuoy Soap",
    brand: "Lifebuoy",
    category: "Personal Care",
    packaging: "Paper",
    ingredients: ["sodium palmate", "palm oil", "preservatives", "artificial colours"],
    ingredientsText:
      "Sodium Palmate, Palm Oil, Preservatives, Artificial Colours",
    ecoscoreGrade: "c",
    image: "/images/lifebuoy-soap.webp",
  },

  "8901063090002": {
    barcode: "8901063090002",
    name: "Real Fruit Juice",
    brand: "Real",
    category: "Soft Drinks",
    packaging: "Tetra Pack",
    ingredients: ["fruit pulp", "sugar", "citric acid", "artificial flavours", "preservatives"],
    ingredientsText:
      "Fruit Pulp, Sugar, Citric Acid, Artificial Flavours, Preservatives",
    ecoscoreGrade: "c",
    image: "/images/real-fruit-juice.webp",
  },

  "8901063031628": {
    barcode: "8901063031628",
    name: "Britannia Good Day",
    brand: "Britannia",
    category: "Biscuits",
    packaging: "Plastic",
    ingredients: ["refined wheat flour", "sugar", "palm oil", "butter", "artificial flavours", "emulsifiers"],
    ingredientsText:
      "Refined Wheat Flour, Sugar, Palm Oil, Butter, Artificial Flavours, Emulsifiers",
    ecoscoreGrade: "d",
    image: "/images/britannia-good-day.webp",
  },

  // --- Green Alternatives Across Core Categories ---

  "RAGI_MALT_001": {
    barcode: "RAGI_MALT_001",
    name: "Organic Ragi Malt",
    brand: "24 Mantra Organic",
    category: "health",
    packaging: "paper",
    ingredients: ["organic ragi", "natural sweetener", "millet", "oats"],
    ingredientsText: "Organic Ragi, Natural Sweetener, Millet, Oats",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 81,
    image: "/images/ragi-malt.webp",
  },

  "MILLET_MIX_001": {
    barcode: "MILLET_MIX_001",
    name: "Millet Health Mix",
    brand: "Organic India",
    category: "health",
    packaging: "paper",
    ingredients: ["foxtail millet", "pearl millet", "ragi", "oats", "whole wheat"],
    ingredientsText: "Foxtail Millet, Pearl Millet, Ragi, Oats, Whole Wheat",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 80,
    image: "/images/millet-mix.webp",
  },

  "SATHU_001": {
    barcode: "SATHU_001",
    name: "Sathu Maavu",
    brand: "Farm Fresh",
    category: "health",
    packaging: "paper",
    ingredients: ["ragi", "whole wheat", "millet", "natural ingredients"],
    ingredientsText: "Ragi, Whole Wheat, Millet, Natural Ingredients",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 80,
    image: "/images/sathu-maavu.webp",
  },

  "MULTIGRAIN_001": {
    barcode: "MULTIGRAIN_001",
    name: "Nutri Choice Digestive",
    brand: "Britannia",
    category: "biscuit",
    packaging: "paper",
    ingredients: ["whole wheat", "oats", "millet", "natural flavours"],
    ingredientsText: "Whole Wheat, Oats, Millet, Natural Flavours",
    ecoScore: "b",
    ecoscoreGrade: "b",
    greenScore: 73,
    image: "/images/nutri-choice-digestive.webp",
  },

  "RAGI_BISCUIT_001": {
    barcode: "RAGI_BISCUIT_001",
    name: "Ragi Biscuits",
    brand: "Millet Amma",
    category: "biscuit",
    packaging: "paper",
    ingredients: ["ragi", "whole wheat", "natural sweetener", "oats"],
    ingredientsText: "Ragi, Whole Wheat, Natural Sweetener, Oats",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 80,
    image: "/images/ragi-biscuits.webp",
  },

  "RAGI_NOODLES_001": {
    barcode: "RAGI_NOODLES_001",
    name: "Ragi Noodles",
    brand: "Early Foods",
    category: "noodles",
    packaging: "paper",
    ingredients: ["ragi", "whole wheat", "natural spices", "oats"],
    ingredientsText: "Ragi, Whole Wheat, Natural Spices, Oats",
    ecoScore: "b",
    ecoscoreGrade: "b",
    greenScore: 72,
    image: "/images/ragi-noodles.webp",
  },

  "MILLET_NOODLES_001": {
    barcode: "MILLET_NOODLES_001",
    name: "Millet Noodles",
    brand: "Slurrp Farm",
    category: "noodles",
    packaging: "paper",
    ingredients: ["foxtail millet", "whole wheat", "natural flavours"],
    ingredientsText: "Foxtail Millet, Whole Wheat, Natural Flavours",
    ecoScore: "b",
    ecoscoreGrade: "b",
    greenScore: 73,
    image: "/images/millet-noodles.webp",
  },

  "MAKHANA_001": {
    barcode: "MAKHANA_001",
    name: "Roasted Makhana",
    brand: "PHOOL",
    category: "snack",
    packaging: "paper",
    ingredients: ["fox nuts", "himalayan salt", "natural spices"],
    ingredientsText: "Fox Nuts, Himalayan Salt, Natural Spices",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 71,
    image: "/images/roasted-makhana.webp",
  },

  "MULTIGRAIN_CHIPS_001": {
    barcode: "MULTIGRAIN_CHIPS_001",
    name: "Multigrain Chips",
    brand: "Baked Fresh",
    category: "snack",
    packaging: "paper",
    ingredients: ["whole wheat", "millet", "oats", "natural seasoning"],
    ingredientsText: "Whole Wheat, Millet, Oats, Natural Seasoning",
    ecoScore: "b",
    ecoscoreGrade: "b",
    greenScore: 73,
    image: "/images/multigrain-chips.webp",
  },

  "COCONUT_WATER_001": {
    barcode: "COCONUT_WATER_001",
    name: "Tender Coconut Water",
    brand: "Raw Pressery",
    category: "beverage",
    packaging: "tetra pack",
    ingredients: ["100% natural coconut water"],
    ingredientsText: "100% Natural Coconut Water",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 69,
    image: "/images/tender-coconut-water.webp",
  },

  "REAL_JUICE_GREEN_001": {
    barcode: "REAL_JUICE_GREEN_001",
    name: "Green Smoothie",
    brand: "Raw Pressery",
    category: "beverage",
    packaging: "glass",
    ingredients: ["spinach", "apple", "ginger", "natural ingredients", "organic"],
    ingredientsText: "Spinach, Apple, Ginger, Natural Ingredients, Organic",
    ecoScore: "a",
    ecoscoreGrade: "a",
    greenScore: 77,
    image: "/images/green-smoothie.webp",
  },
};

/**
 * Flat array of all curated products.
 */
export const curatedProducts = Object.values(curatedProductsMap);
