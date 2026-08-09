import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiPhone,
  FiUser,
  FiUserPlus,
  FiShield,
} from "react-icons/fi";

const API_BASE_URL = "https://the-craddle-cafe-backend.vercel.app/api/users";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateName = (value) => {
    if (!value.trim()) return "Name is required";
    if (/\d/.test(value)) return "Name cannot contain numbers";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Name can only contain letters";
    if (value.trim().length < 3) return "Name must be at least 3 characters";
    return "";
  };

  const validateContact = (value) => {
    if (!value.trim()) return "Contact number is required";
    if (!/^\d+$/.test(value)) return "Contact number must contain only digits";
    if (value.length !== 11) return "Contact number must be exactly 11 digits";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (value, password) => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const validateForm = () => {
    const nameError = validateName(formData.name);
    const contactError = validateContact(formData.contact);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );

    setErrors({
      name: nameError,
      contact: contactError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    return (
      !nameError && !contactError && !passwordError && !confirmPasswordError
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        name: formData.name.trim(),
        contact: formData.contact,
        password: formData.password,
      });

      const { user, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success("Account created successfully!");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
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

  const inputBase =
    "w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-sky-50/60 border text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white";
  const inputOk = "border-sky-100 focus:ring-sky-200 focus:border-sky-400";
  const inputErr = "border-red-300 focus:ring-red-200";

  const Field = ({
    id,
    label,
    icon: Icon,
    error,
    toggle,
    showValue,
    onToggle,
    ...rest
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-600 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`text-base ${error ? "text-red-400" : "text-sky-400"}`} />
        </span>
        <input
          id={id}
          name={id}
          onKeyDown={handleKeyDown}
          className={`${inputBase} ${toggle ? "pr-10" : ""} ${
            error ? inputErr : inputOk
          }`}
          {...rest}
        />
        {toggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showValue ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-red-500 leading-tight">{error}</p>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full flex items-center justify-center p-3 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* soft ambient blobs */}
      <div className="pointer-events-none absolute -top-28 -left-28 w-64 h-64 sm:w-80 sm:h-80 bg-sky-200/50 rounded-full blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-28 -right-28 w-64 h-64 sm:w-80 sm:h-80 bg-cyan-200/50 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white/85 backdrop-blur-xl border border-white shadow-xl shadow-sky-200/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          {/* Heading */}
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-md shadow-sky-300/40 flex items-center justify-center mb-2">
              <FiUserPlus className="text-white text-base" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Create your account
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Sign up to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <Field
              id="name"
              label="Full Name"
              icon={FiUser}
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

            <Field
              id="contact"
              label="Contact Number"
              icon={FiPhone}
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              placeholder="03001234567"
              value={formData.contact}
              onChange={handleChange}
              error={errors.contact}
            />

            <Field
              id="password"
              label="Password"
              icon={FiLock}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              toggle
              showValue={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
            />

            <Field
              id="confirmPassword"
              label="Confirm Password"
              icon={FiLock}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              toggle
              showValue={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-sky-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] mt-1"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  Creating account...
                </>
              ) : (
                <>
                  <FiUserPlus className="text-base" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <FiShield className="text-[10px]" />
            Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;