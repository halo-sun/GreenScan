import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function GlobalCompareBanner() {
  const [compareProduct, setCompareProduct] = useState(null);
  const location = useLocation();

  useEffect(() => {
    function loadCompareProduct() {
      const saved = window.localStorage.getItem("compareProduct");
      if (saved) {
        try {
          setCompareProduct(JSON.parse(saved));
        } catch {
          setCompareProduct(null);
        }
      } else {
        setCompareProduct(null);
      }
    }

    loadCompareProduct();

    const handleStorage = () => loadCompareProduct();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("compareProductChanged", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("compareProductChanged", handleStorage);
    };
  }, []);

  const isProductPage = location.pathname.startsWith("/product/");
  if (isProductPage && compareProduct) {
    const productBarcode = location.pathname.split("/product/")[1];
    if (productBarcode === compareProduct.barcode) {
      return null;
    }
  }

  if (!compareProduct) return null;

  function handleClear() {
    window.localStorage.removeItem("compareProduct");
    setCompareProduct(null);
    window.dispatchEvent(new Event("compareProductChanged"));
    if (window.clearCompareFromProduct) {
      window.clearCompareFromProduct();
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-md p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-300 truncate">
            Saved: {compareProduct.name || compareProduct.barcode}
          </p>
          <p className="text-xs text-emerald-200/75">
            Scan another product to compare
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/product/${compareProduct.barcode}`}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            View
          </Link>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-red-400/20 px-2 py-2 text-red-300 hover:bg-red-500/10 transition-colors"
            aria-label="Clear compare"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
