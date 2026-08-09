import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Product from "./pages/Product";
import Expense from "./pages/Expense";
import Category from "./pages/Category";
import Stock from "./pages/Stock";
import Dashboard2 from "./pages/Dashboard2";

function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/products" element={<Product />} />
        <Route path="/expenses" element={<Expense />} />
        <Route path="/categories" element={<Category />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/dashboard" element={<Dashboard2 />} />
      </Routes>
    </>
  );
}

export default App;