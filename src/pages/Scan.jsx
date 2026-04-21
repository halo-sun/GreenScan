import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BarcodeScanner from "../components/BarcodeScanner";
import { fetchProduct } from "../lib/productFetcher";
import { saveScanToUser, updateGlobalLeaderboard } from "../lib/firestoreHelpers";

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
    </MotionDiv>
  );
}
