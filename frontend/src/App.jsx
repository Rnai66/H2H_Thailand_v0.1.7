// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import api from "./lib/api";
import { getToken, setToken ,} from "./lib/auth";

import ChatPage from "./pages/ChatPage";
import PageFade from "./components/PageFade";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Tokens from "./pages/Tokens";
import PaymentsPage from "./pages/PaymentsPage";
import UsersPage from "./pages/UsersPage";
import ItemsPage from "./pages/ItemsPage";
import H2HLayout from "./ui/H2HLayout";

// หน้า Dashboard และ ItemList แบบเบา
import Dashboard from "./pages/Dashboard.jsx";
import ItemList from "./pages/ItemList.jsx";
import ItemEdit from "./pages/ItemEdit.jsx";
import ItemsAdmin from "./pages/ItemsAdmin.jsx";

/* ---------- Guards ---------- */
function Protected({ me, children }) {
  if (!me) return <Navigate to="/login" replace />;
  return children;
}
function AdminOnly({ me, children }) {
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

/* ---------- Home ---------- */
function Home() {
  return (
    <div className="page-fade section">
      <h2 className="text-3xl font-semibold title-glow mb-2">Welcome to H2H Thailand</h2>
      <p className="text-[var(--fg-muted)] max-w-2xl">
        ระบบ H2H Digital Silk UI — โทน Blue–Gold + Glassmorphism พร้อมการจัดการผู้ใช้
        สินค้า การชำระเงิน และโทเคนแบบครบวงจร 💙🟨
      </p>
    </div>
  );
}

/* ---------- InnerApp (อยู่ใต้ Router ที่ index.jsx ครอบอยู่) ---------- */
function InnerApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  async function fetchMe() {
  const tok = getToken();
  if (!tok) {
    setMe(null);
    setLoadingMe(false);
    return;
  }
  try {
    const res = await api("/api/auth/profile", { auth: true });
    setMe(res.user || null);
  } catch (e) {
    if (e.status === 401) {
      setToken("");
      setMe(null);
      // เด้งไปหน้า login เพื่อขอโทเคนใหม่
      navigate("/login", { replace: true });
    } else {
      // error อื่นๆ แค่ถือว่าไม่ล็อกอิน
      setMe(null);
    }
  } finally {
    setLoadingMe(false);
  }
}
  useEffect(() => {
    fetchMe();
  }, []);

  function handleLoggedIn(token) {
    setToken(token);
    toast.success("✅ Logged in successfully!");
    fetchMe().then(() => navigate("/items"));
  }
  function handleLogout() {
    setToken("");
    setMe(null);
    toast("Logged out");
    navigate("/login");
  }

  const Wrapper = PageFade || (({ children }) => <>{children}</>);

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--fg-muted)]">
        Loading user profile...
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" />
      <Wrapper key={location.pathname}>
        <Routes location={location}>
          {/* Public */}
          <Route path="/login" element={<Login onLoggedIn={handleLoggedIn} />} />
          <Route path="/register" element={<Register onLoggedIn={handleLoggedIn} />} />

          {/* Protected layout */}
          <Route element={<H2HLayout me={me} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="/" element={<Home />} />

            <Route
              path="/dashboard"
              element={
                <Protected me={me}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/items"
              element={
                <Protected me={me}>
                  <ItemsPage />
                </Protected>
              }
            />
            <Route
              path="/items-list"
              element={
                <Protected me={me}>
                  <ItemList />
                </Protected>
              }
            />

            <Route
              path="/users"
              element={
                <AdminOnly me={me}>
                  <UsersPage />
                </AdminOnly>
              }
            />
            <Route
              path="/tokens"
              element={
                <AdminOnly me={me}>
                  <Tokens toast={toast} />
                </AdminOnly>
              }
            />
            <Route
              path="/payments"
              element={
                <AdminOnly me={me}>
                  <PaymentsPage />
                </AdminOnly>
              }
            />
            <Route
  path="/profile"
  element={
    <Protected me={me}>
      <Profile me={me} toast={toast} />
    </Protected>
  }
/>
<Route
  path="/items/:id/edit"
  element={
    <Protected me={me}>
      <ItemEdit />
    </Protected>
  }
/>
<Route
  path="/items-admin"
  element={
    <Protected me={me}>
      <ItemsAdmin me={me} toast={toast} />
    </Protected>
  }
/>



            <Route
              path="/chat/:roomId"
              element={
                <Protected me={me}>
                  <ChatPage me={me} />
                </Protected>
              }
            />

            <Route path="*" element={<div>Not found</div>} />
          </Route>
        </Routes>
      </Wrapper>
    </>
  );
}

/* ---------- App หลัก: ไม่ครอบ Router ที่นี่ ---------- */
export default function App() {
  return <InnerApp />;
}
