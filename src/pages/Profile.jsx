import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

export default function Profile() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "scans"),
          orderBy("scannedAt", "desc")
        );
        const snapshot = await getDocs(q);
        // Deduplicate by barcode in memory so we just show unique products they've scanned
        // Alternatively, show full history. Let's show full history for now.
        const history = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScans(history);
      } catch (err) {
        console.error("Error fetching user scans:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, [user]);

  if (!user) return null; // Should be handled by ProtectedRoute, but safe fallback

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gray-900/60 p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6 mb-12 backdrop-blur-sm">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-full ring-4 ring-emerald-500/30" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-4xl text-white font-bold">
            {(user.displayName || user.email || "U")[0].toUpperCase()}
          </div>
        )}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-2">{user.displayName || "Anonymous User"}</h1>
          <p className="text-gray-400">{user.email}</p>
        </div>
        <div className="md:ml-auto flex gap-4 text-center mt-6 md:mt-0">
          <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
            <div className="text-3xl font-bold text-emerald-400 mb-1">{scans.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Scans</div>
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Your Scan History</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : scans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {scans.map((scan) => (
              <Link key={scan.id} to={`/product/${scan.barcode}`}>
                <ProductCard product={scan} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/30 rounded-3xl border border-white/5">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-xl text-gray-300 font-medium mb-4">No scans yet</p>
            <Link to="/scan" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
              Start Scanning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
