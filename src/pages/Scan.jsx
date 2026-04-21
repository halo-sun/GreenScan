import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import BarcodeScanner from "../components/BarcodeScanner";
import { fetchProduct } from "../lib/productFetcher";
import { saveScanToUser, updateGlobalLeaderboard } from "../lib/firestoreHelpers";
import { db } from "../lib/firebase";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export default function Scan() {
  const MotionDiv = motion.div;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [compareProduct, setCompareProduct] = useState(() => {
    const savedCompare = window.localStorage.getItem("compareProduct");

    if (!savedCompare) return null;

    try {
      return JSON.parse(savedCompare);
    } catch {
      return null;
    }
  });

  const handleScan = async (barcode) => {
    setLoading(true);
    setError("");

    try {
      const product = await fetchProduct(barcode);

      if (product) {
        Promise.all([
          saveScanToUser(user.uid, product),
          updateGlobalLeaderboard(product),
        ]).catch((err) => console.error("Error logging scan:", err));

        if (compareProduct?.barcode) {
          navigate(`/compare?left=${compareProduct.barcode}&right=${barcode}`);
        } else {
          navigate(`/product/${barcode}`);
        }
      } else {
        navigate(`/product/${barcode}?notfound=true`);
      }
    } catch (err) {
      console.error("Scan processing error:", err);
      setError("Failed to process barcode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function clearCompareProduct() {
    window.localStorage.removeItem("compareProduct");
    setCompareProduct(null);
  }

  async function handleManualSearch(event) {
    event.preventDefault();
    const term = manualQuery.trim();
    if (!term) {
      setSearchResults([]);
      setSearchMessage("Enter a product name or barcode number.");
      return;
    }

    setSearching(true);
    setError("");
    setSearchMessage("");

    try {
      if (/^\d+$/.test(term)) {
        const barcodeDoc = await getDoc(doc(db, "products", term));
        if (barcodeDoc.exists()) {
          const product = barcodeDoc.data();
          setSearchResults([{ id: barcodeDoc.id, ...product }]);
          setSearchMessage("1 product found.");
        } else {
          setSearchResults([]);
          setSearchMessage("Not found in Firestore yet. Opening product lookup...");
          navigate(`/product/${term}`);
        }
        return;
      }

      const productsRef = collection(db, "products");
      const startsWithQuery = query(
        productsRef,
        orderBy("name"),
        startAt(term),
        endAt(`${term}\uf8ff`),
        limit(8),
      );
      const snapshot = await getDocs(startsWithQuery);

      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setSearchResults(items);
      setSearchMessage(items.length ? `${items.length} product(s) found.` : "No matching products found.");
    } catch (err) {
      console.error("Manual search failed:", err);
      setSearchResults([]);
      setSearchMessage("Manual search failed. Try scanning or search again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <MotionDiv
      {...PAGE_TRANSITION}
      className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto flex flex-col items-center"
    >
      {compareProduct && (
        <div className="mb-6 w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Compare with {compareProduct.name || compareProduct.barcode}
            </p>
            <p className="text-sm text-emerald-200/75">
              Your next successful scan will open a side-by-side comparison.
            </p>
          </div>
          <button
            type="button"
            onClick={clearCompareProduct}
            className="self-start rounded-xl border border-emerald-400/20 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="mb-2 text-4xl font-bold text-[color:var(--text-primary)]">Scan Product</h1>
        <p className="text-[color:var(--text-muted)]">Point your camera at a barcode to get its Green Score.</p>
      </div>

      <div className="w-full rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 md:p-10 shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="font-medium animate-pulse text-emerald-400">
              {compareProduct ? "Preparing comparison..." : "Analyzing product..."}
            </p>
          </div>
        ) : (
          <BarcodeScanner onResult={handleScan} />
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 w-full rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">Manual Search</h2>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          Search by product name or barcode when camera scan isn&apos;t available.
        </p>
        <form onSubmit={handleManualSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={manualQuery}
            onChange={(event) => setManualQuery(event.target.value)}
            placeholder="Type product name or barcode"
            className="flex-1 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/40 px-4 py-3 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-white font-medium hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchMessage && (
          <p className="mt-3 text-sm text-[color:var(--text-muted)]">{searchMessage}</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 grid gap-3">
            {searchResults.map((item) => (
              <button
                key={item.id || item.barcode}
                type="button"
                onClick={() => navigate(`/product/${item.barcode}`)}
                className="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/40 px-4 py-3 text-left hover:border-emerald-500/40 transition-colors"
              >
                <p className="font-semibold text-[color:var(--text-primary)]">{item.name || "Unknown Product"}</p>
                <p className="text-sm text-[color:var(--text-muted)]">
                  {(item.brand || "Unknown Brand")} • {item.category || "Uncategorized"} • {item.barcode}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
