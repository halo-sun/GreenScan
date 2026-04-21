import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BarcodeScanner from "../components/BarcodeScanner";
import { fetchProduct } from "../lib/productFetcher";
import { saveScanToUser, updateGlobalLeaderboard } from "../lib/firestoreHelpers";

export default function Scan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async (barcode) => {
    setLoading(true);
    setError("");

    try {
      const product = await fetchProduct(barcode);

      if (product) {
        // Log the scan asynchronously
        Promise.all([
          saveScanToUser(user.uid, product),
          updateGlobalLeaderboard(product)
        ]).catch(err => console.error("Error logging scan:", err));

        // Navigate to product page
        navigate(`/product/${barcode}`);
      } else {
        // Navigating to product page will show the "Not Found" state there
        navigate(`/product/${barcode}?notfound=true`);
      }
    } catch (err) {
      console.error("Scan processing error:", err);
      setError("Failed to process barcode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Scan Product</h1>
        <p className="text-gray-400">Point your camera at a barcode to get its Green Score.</p>
      </div>

      <div className="w-full bg-gray-900/40 p-6 md:p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-emerald-400 font-medium animate-pulse">Analyzing product...</p>
          </div>
        ) : (
          <BarcodeScanner onResult={handleScan} />
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
