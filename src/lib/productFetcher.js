import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { calculateGreenScore, getScoreLabel } from "./greenScore";
import { curatedProductsMap } from "../data/curatedProducts";

const OFF_API_V0 = "https://world.openfoodfacts.org/api/v0/product";
const OFF_API_V2 = "https://world.openfoodfacts.org/api/v2/product";

function normalizeCategoryText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9,\s/-]/g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSpecificCategory(categoriesString = "", fallbackCategory = "") {
  const categories = normalizeCategoryText(categoriesString)
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

  if (categories.length === 0) {
    return normalizeCategoryText(fallbackCategory);
  }

  const scored = categories.map((value, index) => ({
    value,
    index,
    wordCount: value.split(" ").filter(Boolean).length,
    charCount: value.length,
  }));

  scored.sort((a, b) => {
    if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
    if (b.charCount !== a.charCount) return b.charCount - a.charCount;
    return b.index - a.index;
  });

  return scored[0]?.value || normalizeCategoryText(fallbackCategory);
}

function extractCategoryTags(categoriesString = "", fallbackCategory = "") {
  const source = `${categoriesString || ""}, ${fallbackCategory || ""}`;

  const tags = normalizeCategoryText(source)
    .split(/[\s,]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  return [...new Set(tags)];
}

function getTopCategoryWords(normalizedCategory = "", categoryTags = []) {
  const preferred = normalizeCategoryText(normalizedCategory)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  if (preferred.length > 0) {
    return [...new Set(preferred)].slice(0, 10);
  }

  return [...new Set((categoryTags || []).filter((word) => (word || "").length >= 3))].slice(0, 10);
}

/**
 * Normalize a product object so it has a consistent shape
 * and attach greenScore + label metrics.
 */
function enrichProduct(product) {
  const greenScore = calculateGreenScore(product);
  const { label, colorClass } = getScoreLabel(greenScore);
  const categoriesText = product.categoriesText || product.categories || product.category || "";
  const normalizedCategory =
    product.normalizedCategory || extractSpecificCategory(categoriesText, product.category || "");
  const categoryTags =
    Array.isArray(product.categoryTags) && product.categoryTags.length > 0
      ? [...new Set(product.categoryTags.map((tag) => (tag || "").toLowerCase().trim()).filter(Boolean))]
      : extractCategoryTags(categoriesText, product.category || "");

  return {
    ...product,
    greenScore,
    scoreLabel: label,
    scoreColor: colorClass,
    normalizedCategory,
    categoryTags,
  };
}

/**
 * Map an OpenFoodFacts API response to our product schema.
 */
function mapOFFProduct(data, barcode) {
  const product = data.product || {};

  // 1. Packaging
  const packagingRaw = [
    product.packaging || "",
    ...(product.packaging_tags || [])
  ].join(" ").toLowerCase();

  let packaging = "Plastic"; // default
  if (packagingRaw.includes("glass")) packaging = "Glass";
  else if (packagingRaw.includes("paper") || packagingRaw.includes("cardboard")) packaging = "Paper";
  else if (packagingRaw.includes("metal") || packagingRaw.includes("tin") || packagingRaw.includes("aluminium")) packaging = "Metal";
  else if (packagingRaw.includes("tetra")) packaging = "Tetra Pack";

  // 2. Ingredients
  const ingredientsText = product.ingredients_text || product.ingredients_text_en || "";
  const ingredients = ingredientsText
    .toLowerCase()
    .split(/[,;()]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 3. Categories
  const categoriesRaw = [
    product.categories || "",
    ...(product.categories_tags || [])
  ].join(" ").toLowerCase();
  const categoriesText =
    (product.categories || "").trim() ||
    (product.categories_tags || [])
      .map((tag) => tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
      .join(", ");

  let category = "Snacks"; // default
  if (categoriesRaw.includes("biscuit") || categoriesRaw.includes("cookie")) category = "Biscuits";
  else if (categoriesRaw.includes("soft drink") || categoriesRaw.includes("beverage") || categoriesRaw.includes("soda")) category = "Soft Drinks";
  else if (categoriesRaw.includes("dairy") || categoriesRaw.includes("milk") || categoriesRaw.includes("cheese") || categoriesRaw.includes("yogurt")) category = "Dairy";
  else if (categoriesRaw.includes("health") || categoriesRaw.includes("malt") || categoriesRaw.includes("nutrition")) category = "Health Drinks";
  else if (categoriesRaw.includes("noodle") || categoriesRaw.includes("instant")) category = "Instant Noodles";
  else if (categoriesRaw.includes("tea") || categoriesRaw.includes("coffee")) category = "Tea/Coffee";
  else if (categoriesRaw.includes("personal") || categoriesRaw.includes("soap") || categoriesRaw.includes("shampoo")) category = "Personal Care";

  const mapped = {
    barcode,
    name: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    category,
    categoriesText,
    packaging,
    ingredients,
    ingredientsText,
    ecoscoreGrade: product.ecoscore_grade || "",
    image: product.image_front_url || product.image_url || "",
    source: "openfoodfacts",
  };

  // 4. Logging found/missing fields
  const missing = [];
  const found = [];

  Object.entries(mapped).forEach(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0) || value === "Unknown Product" || value === "Unknown Brand") {
      missing.push(key);
    } else {
      found.push(key);
    }
  });

  console.log(`[Product Fetch] Barcode: ${barcode}`);
  console.log(`- Found fields: ${found.join(", ")}`);
  if (missing.length > 0) {
    console.log(`- Missing fields: ${missing.join(", ")}`);
  }

  return mapped;
}

/**
 * Fetch a product by barcode using a cascading lookup:
 * 1. Firestore cache (products/{barcode})
 * 2. Local curated products
 * 3. OpenFoodFacts API (v0, with v2 fallback for missing fields)
 *
 * Returns an enriched product with greenScore & metrics, or null.
 */
export async function fetchProduct(barcode) {
  if (!barcode) return null;

  const cleanBarcode = barcode.trim();

  // --- 1. Check Firestore first ---
  try {
    const docRef = doc(db, "products", cleanBarcode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const product = docSnap.data();
      return enrichProduct(product);
    }
  } catch (err) {
    console.warn("Firestore lookup failed:", err.message);
  }

  // --- 2. Check curated products ---
  if (curatedProductsMap[cleanBarcode]) {
    const product = { ...curatedProductsMap[cleanBarcode], source: "curated" };
    const enriched = enrichProduct(product);

    try {
      await setDoc(doc(db, "products", cleanBarcode), {
        ...enriched,
        cachedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to cache curated product:", err.message);
    }

    return enriched;
  }

  // --- 3. Fetch from OpenFoodFacts API ---
  try {
    const response = await fetch(`${OFF_API_V0}/${cleanBarcode}.json`);

    if (!response.ok) {
      throw new Error(`OFF API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    let productData = data.product;
    const hasIngredients = productData.ingredients_text || productData.ingredients_text_en;

    // Fallback to v2 API if ingredients are missing
    if (!hasIngredients) {
      try {
        const v2Url = `${OFF_API_V2}/${cleanBarcode}?fields=product_name,ingredients_text,categories,packaging,packaging_tags,categories_tags,brands,image_front_url,ecoscore_grade,nutriscore_grade,labels,manufacturing_places`;
        const v2Response = await fetch(v2Url);

        if (v2Response.ok) {
          const v2Data = await v2Response.json();
          if (v2Data.status === 1 && v2Data.product) {
            // Merge v2 data into productData (prefer existing non-empty values)
            for (const key in v2Data.product) {
              const v2Value = v2Data.product[key];
              const isV2ValueMeaningful = Array.isArray(v2Value) ? v2Value.length > 0 : !!v2Value;
              const isV0ValueEmpty = Array.isArray(productData[key]) ? productData[key].length === 0 : !productData[key];

              if (isV2ValueMeaningful && isV0ValueEmpty) {
                productData[key] = v2Value;
              }
            }
          }
        }
      } catch (v2Err) {
        console.warn("OFF v2 fetch failed:", v2Err.message);
      }
    }

    const product = mapOFFProduct({ product: productData }, cleanBarcode);
    const enriched = enrichProduct(product);

    // Cache to Firestore
    try {
      await setDoc(doc(db, "products", cleanBarcode), {
        ...enriched,
        cachedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to cache OFF product:", err.message);
    }

    return enriched;
  } catch (err) {
    console.error("OpenFoodFacts fetch failed:", err.message);
  }

  // --- 4. All sources exhausted ---
  return null;
}

/**
 * Fetch greener alternatives from Firestore based on category metadata.
 * Returns [] when no relevant alternatives are found.
 */
export async function fetchAlternatives(product) {
  if (!product) return [];

  const enrichedProduct = enrichProduct(product);
  const normalizedCategory = enrichedProduct.normalizedCategory;
  const currentScore =
    typeof product.greenScore === "number" ? product.greenScore : enrichedProduct.greenScore;
  const currentBarcode = product.barcode || "";

  if (!normalizedCategory) {
    return [];
  }

  try {
    const productsRef = collection(db, "products");

    const exactQuery = query(
      productsRef,
      where("normalizedCategory", "==", normalizedCategory),
      where("greenScore", ">", currentScore),
      orderBy("greenScore", "desc"),
      limit(5),
    );
    const exactSnap = await getDocs(exactQuery);
    const exactMatches = exactSnap.docs
      .map((docSnap) => docSnap.data())
      .filter((item) => item && item.barcode !== currentBarcode)
      .slice(0, 5);

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    const topCategoryWords = getTopCategoryWords(
      normalizedCategory,
      enrichedProduct.categoryTags || [],
    );

    if (topCategoryWords.length === 0) {
      return [];
    }

    const broaderQuery = query(
      productsRef,
      where("categoryTags", "array-contains-any", topCategoryWords),
      where("greenScore", ">", currentScore),
      orderBy("greenScore", "desc"),
      limit(5),
    );
    const broaderSnap = await getDocs(broaderQuery);
    const broaderMatches = broaderSnap.docs
      .map((docSnap) => docSnap.data())
      .filter((item) => item && item.barcode !== currentBarcode)
      .slice(0, 5);

    return broaderMatches;
  } catch (err) {
    console.warn("Failed to fetch alternatives:", err.message);
    return [];
  }
}
