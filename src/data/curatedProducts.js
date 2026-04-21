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
