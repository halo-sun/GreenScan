import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import ProductCard from "../components/ProductCard";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

const MAJOR_CATEGORIES = [
  { key: "sauces", title: "Best Sauce" },
  { key: "biscuits", title: "Best Biscuit" },
  { key: "health_drinks", title: "Best Health Drink" },
  { key: "soft_drinks", title: "Best Soft Drink" },
  { key: "dairy", title: "Best Dairy Product" },
  { key: "snacks", title: "Best Snack" },
];

function toWords(value = "") {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/[-_/]+/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getCategoryTokens(product = {}) {
  const rawTags = Array.isArray(product.categoryTags) ? product.categoryTags : [];
  const tags = rawTags
    .flatMap((tag) => toWords(tag))
    .filter((token) => token.length >= 3);
  const categoryWords = toWords(product.category || "");
  const normalizedWords = toWords(product.normalizedCategory || "");
  return new Set([...tags, ...categoryWords, ...normalizedWords]);
}

function getMajorCategoryKey(product = {}) {
  const tokens = getCategoryTokens(product);
  const has = (...values) => values.some((value) => tokens.has(value));

  if (has("sauce", "sauces", "ketchup", "ketchups", "condiment", "condiments")) {
    return "sauces";
  }
  if (has("biscuit", "biscuits", "cookie", "cookies")) {
    return "biscuits";
  }
  if (has("health", "malt", "nutrition", "nutritional")) {
    return "health_drinks";
  }
  if (has("soft", "soda", "cola", "beverage", "beverages", "drink", "drinks")) {
    return "soft_drinks";
  }
  if (has("dairy", "milk", "cheese", "yogurt", "yoghurt")) {
    return "dairy";
  }
  if (has("snack", "snacks", "chips", "namkeen")) {
    return "snacks";
  }
  return null;
}

function getTopRatedByCategory(products = []) {
  const leaders = new Map();

  products.forEach((product) => {
    const categoryKey = getMajorCategoryKey(product);
    if (!categoryKey) return;

    const score = Number(product.greenScore);
    if (!Number.isFinite(score)) return;

    const current = leaders.get(categoryKey);
    if (!current || score > Number(current.greenScore)) {
      leaders.set(categoryKey, product);
    }
  });

  return MAJOR_CATEGORIES.map((config) => ({
    ...config,
    product: leaders.get(config.key) || null,
  }));
}

export default function Database() {
  const MotionDiv = motion.div;
  const [products, setProducts] = useState([]);
  const [bestByCategory, setBestByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, "products"), orderBy("name"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
        setBestByCategory(getTopRatedByCategory(data));
      } catch (err) {
        console.error("Error fetching database:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <MotionDiv
      {...PAGE_TRANSITION}
      className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto"
    >
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-[color:var(--text-primary)]">Product Database</h1>
          <p className="text-[color:var(--text-muted)]">Explore analyzed products and their Green Scores.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)] px-10 py-3 text-[color:var(--text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {bestByCategory.length > 0 && (
        <section className="mb-10 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/60 p-6">
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Top Rated In Major Categories</h2>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">
            Highest Green Score products from each key category.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bestByCategory.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/30 p-4">
                <p className="text-sm font-semibold text-emerald-300">{item.title}</p>
                {item.product ? (
                  <Link to={`/product/${item.product.barcode}`} className="mt-2 block">
                    <p className="font-semibold text-[color:var(--text-primary)]">{item.product.name || "Unknown Product"}</p>
                    <p className="text-sm text-[color:var(--text-muted)]">
                      {item.product.brand || "Unknown Brand"} • Green Score {item.product.greenScore ?? "N/A"}
                    </p>
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-[color:var(--text-muted)]">No product available yet.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link key={product.id || product.barcode} to={`/product/${product.barcode}`}>
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/70 py-20 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-[color:var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-xl font-medium text-[color:var(--text-primary)]">No products found</p>
          <p className="mt-2 text-[color:var(--text-muted)]">Try adjusting your search terms.</p>
        </div>
      )}
    </MotionDiv>
  );
}
