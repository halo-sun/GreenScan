import { getScoreLabel } from "../lib/greenScore";

/**
 * Compact product card showing image, info, and green score badge.
 *
 * @param {Object} props
 * @param {Object} props.product - Product object with name, brand, category, image, greenScore
 * @param {function} [props.onClick] - Optional click handler
 */
export default function ProductCard({ product, onClick }) {
  const { label, colorClass } = getScoreLabel(product.greenScore ?? 0);

  // Map Tailwind text color to bg color for the badge
  const badgeBg = {
    "text-emerald-500": "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    "text-green-500": "bg-green-500/15 border-green-500/30 text-green-400",
    "text-yellow-500": "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
    "text-orange-500": "bg-orange-500/15 border-orange-500/30 text-orange-400",
    "text-red-500": "bg-red-500/15 border-red-500/30 text-red-400",
  };

  const badgeClass = badgeBg[colorClass] || badgeBg["text-yellow-500"];

  return (
    <div
      onClick={onClick}
      className={`group bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-800/50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}

        {/* Score badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm ${badgeClass}`}
        >
          {product.greenScore ?? "—"}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm truncate group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-xs mt-1 truncate">{product.brand}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-md">
            {product.category}
          </span>
          <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
        </div>
      </div>
    </div>
  );
}
