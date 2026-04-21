import { AnimatePresence } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import GlobalCompareBanner from "./components/GlobalCompareBanner";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Product from "./pages/Product";
import Database from "./pages/Database";
import Profile from "./pages/Profile";
import Compare from "./pages/Compare";
import Admin from "./pages/Admin";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-app)]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[color:var(--bg-app)] text-[color:var(--text-primary)] font-sans transition-colors duration-300 pb-20 md:pb-0">
      <Navbar />
      <AnimatePresence mode="wait">
        <GlobalCompareBanner />
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/database" element={<Database />} />
          <Route path="/product/:barcode" element={<Product />} />
          <Route path="/compare" element={<Compare />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <Scan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
