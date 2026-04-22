import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function Admin() {
  const MotionDiv = motion.div;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalScansToday: 0,
    totalScansWeek: 0,
    totalScansAllTime: 0,
    mostScannedCategory: "N/A",
    averageGreenScore: 0,
  });
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);

  useEffect(() => {
    async function getScanCountSince(startDate) {
      try {
        const scansQuery = query(
          collectionGroup(db, "scans"),
          where("scannedAt", ">=", startDate),
        );
        const snapshot = await getDocs(scansQuery);
        return snapshot.size;
      } catch (err) {
        console.warn("Collection group scan query failed, using fallback:", err);
      }

      try {
        const fallbackQuery = query(
          collection(db, "scans"),
          where("lastScannedAt", ">=", startDate),
          limit(1000),
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return fallbackSnapshot.size;
      } catch (err) {
        console.warn("Fallback scan query failed:", err);
        return 0;
      }
    }

    async function fetchAdminData() {
      setLoading(true);
      setError("");

      try {
        const [productsResult, scansResult] = await Promise.allSettled([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "scans")),
        ]);

        const products =
          productsResult.status === "fulfilled"
            ? productsResult.value.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
            : [];

        const totalProducts = products.length;
        const productsWithScore = products.filter((item) => typeof item.greenScore === "number");
        const scoreSum = productsWithScore.reduce((sum, item) => sum + item.greenScore, 0);
        const averageGreenScore = productsWithScore.length
          ? Number((scoreSum / productsWithScore.length).toFixed(1))
          : 0;

        const missing = products
          .filter((item) => !(item.ingredientsText || "").trim())
          .slice(0, 50);

        const scanDocs =
          scansResult.status === "fulfilled"
            ? scansResult.value.docs.map((docSnap) => docSnap.data())
            : [];
        const totalScansAllTime = scanDocs.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

        const categoryCounts = {};
        scanDocs.forEach((item) => {
          const category = item.category || "Unknown";
          const count = Number(item.count) || 0;
          categoryCounts[category] = (categoryCounts[category] || 0) + count;
        });
        const mostScannedCategory =
          Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        const todayStart = getStartOfToday();
        const weekStart = getStartOfWeek();

        const [todayCount, weekCount, pendingSuggestionsResult] = await Promise.all([
          getScanCountSince(todayStart),
          getScanCountSince(weekStart),
          getDocs(query(collection(db, "suggestions"), where("status", "==", "pending"))).catch((err) => {
            console.warn("Pending suggestions query failed:", err);
            return null;
          }),
        ]);

        const suggestions = pendingSuggestionsResult
          ? pendingSuggestionsResult.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          : [];

        setStats({
          totalProducts,
          totalScansToday: todayCount,
          totalScansWeek: weekCount,
          totalScansAllTime,
          mostScannedCategory,
          averageGreenScore,
        });
        setMissingIngredients(missing);
        setPendingSuggestions(suggestions);

        if (productsResult.status === "rejected" && scansResult.status === "rejected") {
          setError("Failed to load admin data.");
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
        setError("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  return (
    <MotionDiv
      {...PAGE_TRANSITION}
      className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[color:var(--text-primary)]">Admin Dashboard</h1>
        <p className="mt-2 text-[color:var(--text-muted)]">Live Firestore stats and moderation queue.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">{error}</div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Total Products</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{stats.totalProducts}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Scans Today</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{stats.totalScansToday}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Scans This Week</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{stats.totalScansWeek}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Scans All Time</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{stats.totalScansAllTime}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Most Scanned Category</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--text-primary)]">{stats.mostScannedCategory}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-5">
              <p className="text-sm text-[color:var(--text-muted)]">Average Green Score</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{stats.averageGreenScore}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-6">
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Products Missing Ingredients</h2>
            {missingIngredients.length > 0 ? (
              <div className="mt-4 space-y-2">
                {missingIngredients.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/40 p-3">
                    <p className="font-medium text-[color:var(--text-primary)]">{item.name || "Unknown Product"}</p>
                    <p className="text-sm text-[color:var(--text-muted)]">{item.brand || "Unknown Brand"} • {item.barcode || item.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">No products with missing ingredients found.</p>
            )}
          </section>

          <section className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/80 p-6">
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Pending Suggestions</h2>
            {pendingSuggestions.length > 0 ? (
              <div className="mt-4 space-y-2">
                {pendingSuggestions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/40 p-3">
                    <p className="font-medium text-[color:var(--text-primary)]">{item.name || "Unnamed Suggestion"}</p>
                    <p className="text-sm text-[color:var(--text-muted)]">Barcode: {item.barcode || item.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">No pending suggestions.</p>
            )}
          </section>
        </div>
      )}
    </MotionDiv>
  );
}
