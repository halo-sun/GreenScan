import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

function normalizeScan(scan) {
  const scannedDate = scan.scannedAt?.toDate ? scan.scannedAt.toDate() : new Date();

  return {
    ...scan,
    scannedDate,
    chartLabel: scannedDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    }),
  };
}

export default function Profile() {
  const MotionDiv = motion.div;
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceNow] = useState(() => Date.now());

  useEffect(() => {
    async function fetchScans() {
      if (!user) return;

      try {
        const scansQuery = query(
          collection(db, "users", user.uid, "scans"),
          orderBy("scannedAt", "desc"),
          limit(20),
        );
        const snapshot = await getDocs(scansQuery);
        const history = snapshot.docs.map((doc) => normalizeScan({
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

  const averageScore = useMemo(() => {
    if (!scans.length) return 0;
    return Math.round(scans.reduce((sum, scan) => sum + (scan.greenScore || 0), 0) / scans.length);
  }, [scans]);

  const weeklyTrend = useMemo(() => {
    if (!scans.length) {
      return { label: "No trend yet", delta: 0 };
    }

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const recentWeek = scans.filter((scan) => referenceNow - scan.scannedDate.getTime() <= oneWeekMs);
    const previousWeek = scans.filter((scan) => {
      const age = referenceNow - scan.scannedDate.getTime();
      return age > oneWeekMs && age <= oneWeekMs * 2;
    });

    const recentAverage = recentWeek.length
      ? recentWeek.reduce((sum, scan) => sum + (scan.greenScore || 0), 0) / recentWeek.length
      : 0;
    const previousAverage = previousWeek.length
      ? previousWeek.reduce((sum, scan) => sum + (scan.greenScore || 0), 0) / previousWeek.length
      : 0;
    const delta = Math.round(recentAverage - previousAverage);

    if (!previousWeek.length) {
      return { label: "Building your first weekly benchmark", delta };
    }

    if (delta > 0) {
      return { label: `Improved by ${delta} points vs last week`, delta };
    }

    if (delta < 0) {
      return { label: `Down ${Math.abs(delta)} points vs last week`, delta };
    }

    return { label: "Flat vs last week", delta };
  }, [referenceNow, scans]);

  const chartData = useMemo(() => {
    return [...scans]
      .reverse()
      .map((scan) => ({
        date: scan.chartLabel,
        greenScore: scan.greenScore || 0,
      }));
  }, [scans]);

  if (!user) return null;

  return (
    <MotionDiv
      {...PAGE_TRANSITION}
      className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto"
    >
      <div className="mb-12 flex flex-col items-center gap-6 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-8 backdrop-blur-sm md:flex-row">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="h-24 w-24 rounded-full ring-4 ring-emerald-500/30" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-4xl font-bold text-white">
            {(user.displayName || user.email || "U")[0].toUpperCase()}
          </div>
        )}
        <div className="text-center md:text-left">
          <h1 className="mb-2 text-3xl font-bold text-[color:var(--text-primary)]">{user.displayName || "Anonymous User"}</h1>
          <p className="text-[color:var(--text-muted)]">{user.email}</p>
        </div>
        <div className="mt-6 flex gap-4 text-center md:ml-auto md:mt-0">
          <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/30 px-6 py-4">
            <div className="mb-1 text-3xl font-bold text-emerald-400">{scans.length}</div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Recent Scans</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-6 text-2xl font-bold text-[color:var(--text-primary)]">Your Scan History</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          </div>
        ) : scans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {scans.map((scan) => (
              <Link key={scan.id} to={`/product/${scan.barcode}`}>
                <ProductCard product={scan} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/70 py-16 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-[color:var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
            <p className="mb-4 text-xl font-medium text-[color:var(--text-primary)]">No scans yet</p>
            <Link to="/scan" className="rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-500 transition-colors">
              Start Scanning
            </Link>
          </div>
        )}
      </div>

      {scans.length > 0 && (
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Your Sustainability Journey</h2>
            <p className="mt-2 text-[color:var(--text-muted)]">
              A view of your last 20 scans and how your average score is trending over time.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
            <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6 space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Average Green Score</p>
              <div className="text-6xl font-bold text-emerald-400">{averageScore}</div>
              <p className={`${weeklyTrend.delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {weeklyTrend.label}
              </p>
            </div>

            <div className="rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85 p-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1721",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="greenScore"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </MotionDiv>
  );
}
