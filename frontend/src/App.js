import { lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/site/Layout";
import Home from "./pages/Home";
import MenuPage from "./pages/MenuPage";
import DailyMenuPage from "./pages/DailyMenuPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import OrderPage from "./pages/OrderPage";
import OrderDonePage from "./pages/OrderDonePage";
import LegalPage from "./pages/LegalPage";
import { CartProvider } from "./context/CartContext";

const AdminApp = lazy(() => import("./pages/admin/AdminApp"));

const pages = (daily, about, contact, order, orderDone, terms, privacy) => [
  <Route key="i" index element={<Home />} />,
  <Route key="m" path="menu" element={<MenuPage />} />,
  <Route key="d" path={daily} element={<DailyMenuPage />} />,
  <Route key="a" path={about} element={<AboutPage />} />,
  <Route key="c" path={contact} element={<ContactPage />} />,
  <Route key="o" path={order} element={<OrderPage />} />,
  <Route key="od" path={orderDone} element={<OrderDonePage />} />,
  <Route key="t" path={terms} element={<LegalPage doc="terms" />} />,
  <Route key="p" path={privacy} element={<LegalPage doc="privacy" />} />,
];

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
      <Toaster position="top-center" richColors closeButton />
      <Suspense fallback={<div className="min-h-screen bg-paper" />}>
        <Routes>
          <Route path="/" element={<Layout lang="cs" />}>{pages("denni-menu", "o-nas", "kontakt", "objednavka", "objednavka/hotovo", "obchodni-podminky", "ochrana-osobnich-udaju")}</Route>
          <Route path="/en" element={<Layout lang="en" />}>{pages("daily-menu", "about-us", "contact", "order", "order/done", "terms", "privacy")}</Route>
          <Route path="/kosik/*" element={<Navigate to="/menu/" replace />} />
          <Route path="/en/shopping-cart/*" element={<Navigate to="/en/menu/" replace />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
