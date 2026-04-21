import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth, signIn } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const { user } = useAuth();
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const q = query(
          collection(db, "scans"),
          orderBy("count", "desc"),
          limit(4)
        );
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTopProducts(products);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-24">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto mt-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Scan. Score. <span className="text-emerald-500">Go Green.</span>
        </h1>
        <p className="text-xl text-gray-400">
          Discover the environmental impact of your everyday products. Scan a barcode, get an instant Green Score, and find better alternatives.
        </p>
        <div className="pt-4">
          {user ? (
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Start Scanning
            </Link>
          ) : (
            <button
              onClick={signIn}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              Sign In to Start
            </button>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-gray-900/50 p-8 rounded-3xl border border-white/5 text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">1. Scan Barcode</h3>
          <p className="text-gray-400">Point your camera at any product barcode to instantly identify it from our database.</p>
        </div>
        <div className="bg-gray-900/50 p-8 rounded-3xl border border-white/5 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">2. Get Green Score</h3>
          <p className="text-gray-400">We analyze ingredients, packaging, and category impact to generate a 0-100 score.</p>
        </div>
        <div className="bg-gray-900/50 p-8 rounded-3xl border border-white/5 text-center">
          <div className="w-16 h-16 mx-auto bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">3. Find Alternatives</h3>
          <p className="text-gray-400">Discover greener, healthier alternatives in the same category to make better choices.</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Top Scanned Products</h2>
          <Link to="/database" className="text-emerald-400 hover:text-emerald-300 font-medium">View All &rarr;</Link>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading leaderboard...</div>
        ) : topProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.barcode}`}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12 bg-gray-900/30 rounded-2xl border border-white/5">
            No scans yet. Be the first!
          </div>
        )}
      </section>
    </div>
  );
}
