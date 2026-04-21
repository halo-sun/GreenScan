import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { calculateGreenScore, getScoreLabel } from "./greenScore";
import { curatedProductsMap } from "../data/curatedProducts";

const OFF_API = "https://world.openfoodfacts.org/api/v0/product";

/**
 * Normalize a product object so it has a consistent shape
 * and attach greenScore + label metrics.
 */
function enrichProduct(product) {
  const greenScore = calculateGreenScore(product);
  const { label, colorClass } = getScoreLabel(greenScore);

  return {
    ...product,
    greenScore,
    scoreLabel: label,
    scoreColor: colorClass,
  };
}

/**
 * Map an OpenFoodFacts API response to our product schema.
 */
function mapOFFProduct(data, barcode) {
  const product = data.product || {};

  // Try to determine packaging type
  const packagingRaw = (product.packaging || "").toLowerCase();
  let packaging = "Plastic"; // default
  if (packagingRaw.includes("glass")) packaging = "Glass";
  else if (packagingRaw.includes("paper") || packagingRaw.includes("cardboard")) packaging = "Paper";
  else if (packagingRaw.includes("metal") || packagingRaw.includes("tin") || packagingRaw.includes("aluminium")) packaging = "Metal";
  else if (packagingRaw.includes("tetra")) packaging = "Tetra Pack";

  // Parse ingredients into keyword array
  const ingredientsText = product.ingredients_text || product.ingredients_text_en || "";
  const ingredients = ingredientsText
    .toLowerCase()
    .split(/[,;()]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Map OFF categories to our categories
  const categoriesRaw = (product.categories || "").toLowerCase();
  let category = "Snacks"; // default
  if (categoriesRaw.includes("biscuit") || categoriesRaw.includes("cookie")) category = "Biscuits";
  else if (categoriesRaw.includes("soft drink") || categoriesRaw.includes("beverage") || categoriesRaw.includes("soda")) category = "Soft Drinks";
  else if (categoriesRaw.includes("dairy") || categoriesRaw.includes("milk") || categoriesRaw.includes("cheese") || categoriesRaw.includes("yogurt")) category = "Dairy";
  else if (categoriesRaw.includes("health") || categoriesRaw.includes("malt") || categoriesRaw.includes("nutrition")) category = "Health Drinks";
  else if (categoriesRaw.includes("noodle") || categoriesRaw.includes("instant")) category = "Instant Noodles";
  else if (categoriesRaw.includes("tea") || categoriesRaw.includes("coffee")) category = "Tea/Coffee";
  else if (categoriesRaw.includes("personal") || categoriesRaw.includes("soap") || categoriesRaw.includes("shampoo")) category = "Personal Care";

  return {
    barcode,
    name: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    category,
    packaging,
    ingredients,
    ingredientsText,
    ecoscoreGrade: product.ecoscore_grade || "",
    image: product.image_front_url || product.image_url || "",
    source: "openfoodfacts",
  };
}

/**
 * Fetch a product by barcode using a cascading lookup:
 * 1. Firestore cache (products/{barcode})
 * 2. Local curated products
 * 3. OpenFoodFacts API
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

    // Cache to Firestore for future lookups
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
    const response = await fetch(`${OFF_API}/${cleanBarcode}.json`);

    if (!response.ok) {
      throw new Error(`OFF API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = mapOFFProduct(data, cleanBarcode);
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
