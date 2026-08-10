
import React, { useState, useEffect } from "react";
import {
  Tag,
  Package,
  Wallet,
  ShoppingCart,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  // { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    key: "categories",
    label: "Categories",
    icon: Tag,
    href: "/categories",
  },
  {
    key: "products",
    label: "Products",
    icon: Package,
    href: "/products",
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: Wallet,
    href: "/expenses",
  },
  {
    key: "stock",
    label: "Stock",
    icon: ShoppingCart,
    href: "/stock",
  },
];

export default function SidebarLayout({
  activeKey,
  onNavigate,
  onLogout,
  children,
}) {
  const [internalActive, setInternalActive] = useState(() => {
    if (activeKey) return activeKey;

    if (typeof window !== "undefined") {
      const match = NAV_ITEMS.find((item) =>
        window.location.pathname.startsWith(item.href)
      );

      if (match) return match.key;
    }

    return "dashboard";
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const current = activeKey ?? internalActive;

  /* ---------------------------------------------------------------
     Close drawer with Escape
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  /* ---------------------------------------------------------------
     Prevent body scrolling when mobile drawer is open
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  /* ---------------------------------------------------------------
     Get user from localStorage
  ---------------------------------------------------------------- */
  const user = (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user:", error);
      return null;
    }
  })();

  /* ---------------------------------------------------------------
     Handle navigation
  ---------------------------------------------------------------- */
  const handleSelect = (item) => {
    if (!activeKey) {
      setInternalActive(item.key);
    }

    setMobileOpen(false);

    if (onNavigate) {
      onNavigate(item);
    }
  };

  /* ---------------------------------------------------------------
     User initials
  ---------------------------------------------------------------- */
  const initials = (user?.name || "Admin")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================
          MOBILE TOP BAR
          ============================================================ */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#E4E0D6] bg-[#F7F5F0]/95 px-3 backdrop-blur md:hidden">
        {/* Left side */}
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E4E0D6] bg-white text-[#1C2B33] transition-colors hover:border-[#2F6F63]/50"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-[#1C2B33]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Shop admin
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* User avatar */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F6F63]/10 text-xs font-semibold text-[#2F6F63]"
            title={user?.name || "Admin user"}
          >
            {initials}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#5C6B73] transition-colors hover:bg-[#B23A34]/10 hover:text-[#B23A34]"
            title="Log out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* ============================================================
          MOBILE BACKDROP
          ============================================================ */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[#1C2B33]/40 transition-opacity md:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* ============================================================
          SIDEBAR / MOBILE DRAWER
          ============================================================ */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[#E4E0D6] bg-[#F7F5F0] transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full"
        }`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* ==========================================================
            SIDEBAR HEADER
            ========================================================== */}
        <div className="flex items-center justify-between gap-2 border-b border-[#E4E0D6] px-5 py-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Logo */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1C2B33] text-xs font-semibold text-[#F7F5F0]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              SH
            </div>

            {/* App name */}
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-[#1C2B33]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Shop admin
              </p>

              <p className="truncate text-[11px] text-[#5C6B73]">
                Management console
              </p>
            </div>
          </div>

          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#5C6B73] transition-colors hover:bg-[#E4E0D6]/60 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==========================================================
            MOBILE USER PROFILE
            Visible only inside mobile drawer
            ========================================================== */}
        <div className="border-b border-[#E4E0D6] px-4 py-4 md:hidden">
          <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-3">
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F6F63]/10 text-sm font-semibold text-[#2F6F63]">
              {initials}
            </div>

            {/* User information */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1C2B33]">
                {user?.name || "Admin user"}
              </p>

              <p className="mt-0.5 truncate text-xs text-[#5C6B73]">
                {user?.contact || "No contact available"}
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================================
            NAVIGATION
            ========================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5C6B73]">
            Menu
          </p>

          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = current === item.key;

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#2F6F63]/10 text-[#2F6F63]"
                        : "text-[#5C6B73] hover:bg-[#E4E0D6]/60 hover:text-[#1C2B33]"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />

                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ==========================================================
            DESKTOP USER FOOTER
            Hidden on mobile
            ========================================================== */}
        <div className="hidden items-center gap-2.5 border-t border-[#E4E0D6] px-4 py-4 md:flex">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F6F63]/10 text-xs font-semibold text-[#2F6F63]">
            {initials}
          </div>

          {/* User information */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#1C2B33]">
              {user?.name || "Admin user"}
            </p>

            <p className="truncate text-[11px] text-[#5C6B73]">
              {user?.contact || ""}
            </p>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            className="shrink-0 rounded-md p-1.5 text-[#5C6B73] transition-colors hover:bg-[#B23A34]/10 hover:text-[#B23A34]"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* ============================================================
          PAGE CONTENT
          ============================================================ */}
      <div className="min-w-0 pt-14 md:ml-64 md:pt-0">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ================================================================
   DEMO
   ================================================================ */

function DemoPage({ title }) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <h1
        className="text-xl font-semibold text-[#1C2B33]"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {title}
      </h1>

      <p className="mt-2 text-sm text-[#5C6B73]">
        This is your page content. Everything inside SidebarLayout renders
        here.
      </p>
    </div>
  );
}

export function SidebarLayoutDemo() {
  const [active, setActive] = useState("categories");

  return (
    <SidebarLayout
      activeKey={active}
      onNavigate={(item) => setActive(item.key)}
      onLogout={() => alert("Logged out")}
    >
      <DemoPage
        title={
          NAV_ITEMS.find((item) => item.key === active)?.label ||
          "Shop Admin"
        }
      />
    </SidebarLayout>
  );
}

