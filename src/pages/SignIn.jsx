import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import loginLogo from "../images/login.png";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiPhone,
  FiLogIn,
  FiShield,
} from "react-icons/fi";

const API_BASE_URL = "https://the-craddle-cafe-backend.vercel.app/api/users";

const SignIn = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    contact: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    contact: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/signin", { replace: true });
    }
  }, [navigate]);

  const validateContact = (value) => {
    if (!value.trim()) return "Contact number is required";
    if (!/^\d+$/.test(value)) return "Contact number must contain only digits";
    if (value.length !== 11) return "Contact number must be exactly 11 digits";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    return "";
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const validateForm = () => {
    const contactError = validateContact(formData.contact);
    const passwordError = validatePassword(formData.password);

    setErrors({
      contact: contactError,
      password: passwordError,
    });

    return !contactError && !passwordError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        contact: formData.contact,
        password: formData.password,
      });

      const { user, token } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(`Welcome back, ${user?.name || "User"}!`);

      navigate("/products", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Invalid contact number or password. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 relative p-2 xs:p-3 sm:p-6">
      {/* soft ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-56 h-56 sm:w-96 sm:h-96 bg-sky-200/50 rounded-full blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-56 h-56 sm:w-96 sm:h-96 bg-cyan-200/50 rounded-full blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-40 h-40 bg-blue-100/60 rounded-full blur-3xl hidden sm:block"></div>

      <div className="w-full max-w-md h-full max-h-full flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full bg-white/85 backdrop-blur-xl border border-white shadow-xl shadow-sky-200/50 rounded-2xl sm:rounded-3xl p-4 xs:p-5 sm:p-8 flex flex-col overflow-hidden">
          {/* Logo + heading */}
          <div className="mb-3 sm:mb-6 flex flex-col items-center text-center shrink-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow-md shadow-sky-200/60 border border-sky-100 flex items-center justify-center mb-2 sm:mb-3 overflow-hidden">
              <img
                src={loginLogo}
                alt="Logo"
                className="w-6 h-6 sm:w-9 sm:h-9 object-contain"
              />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-tight">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2.5 sm:space-y-4 shrink-0">
            {/* Contact Field */}
            <div>
              <label
                htmlFor="contact"
                className="block text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-1.5"
              >
                Contact Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                  <FiPhone
                    className={`text-base sm:text-lg ${
                      errors.contact ? "text-red-400" : "text-sky-400"
                    }`}
                  />
                </span>
                <input
                  id="contact"
                  name="contact"
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="03001234567"
                  value={formData.contact}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  maxLength={11}
                  className={`w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-sky-50/60 border text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white ${
                    errors.contact
                      ? "border-red-300 focus:ring-red-200"
                      : "border-sky-100 focus:ring-sky-200 focus:border-sky-400"
                  }`}
                />
              </div>
              {errors.contact && (
                <p className="mt-1 text-[11px] sm:text-xs text-red-500 flex items-center gap-1">
                  {errors.contact}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-medium text-slate-600"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                  <FiLock
                    className={`text-base sm:text-lg ${
                      errors.password ? "text-red-400" : "text-sky-400"
                    }`}
                  />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-sky-50/60 border text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white ${
                    errors.password
                      ? "border-red-300 focus:ring-red-200"
                      : "border-sky-100 focus:ring-sky-200 focus:border-sky-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-base sm:text-lg" />
                  ) : (
                    <FiEye className="text-base sm:text-lg" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] sm:text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-sky-300 bg-white text-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <FiLogIn className="text-base sm:text-lg" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-slate-500 shrink-0">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-2 sm:mt-4 text-center text-[10px] sm:text-xs text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
          <FiShield className="text-xs sm:text-sm" />
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default SignIn;