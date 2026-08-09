import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
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
  { key: "categories", label: "Categories", icon: Tag, href: "/categories" },
  { key: "products", label: "Products", icon: Package, href: "/products" },
  { key: "expenses", label: "Expenses", icon: Wallet, href: "/expenses" },
  { key: "stock", label: "Stock", icon: ShoppingCart, href: "/stock" },
];

/* ------------------------------------------------------------------ */
/*  SidebarLayout
 *
 *  A drop-in page shell. Import it once and wrap each page's content —
 *  you don't need to think about the sidebar again after that.
 *
 *    import SidebarLayout from "./SidebarLayout";
 *
 *    export default function ProductsPage() {
 *      return (
 *        <SidebarLayout
 *          activeKey="products"
 *          user={{ name: "Amina Raza", contact: "amina@shop.com" }}
 *          onNavigate={(item) => router.push(item.href)}
 *          onLogout={() => signOut()}
 *        >
 *          <YourPageContent />
 *        </SidebarLayout>
 *      );
 *    }
 *
 *  Props:
 *    activeKey   - key of the current nav item ("dashboard", "products", ...).
 *                  Falls back to matching window.location.pathname, then "dashboard".
 *    onNavigate  - (item) => void, fired when a nav item is clicked. Do your
 *                  routing here (react-router's navigate, Next's router.push, etc).
 *    user        - { name, contact } shown in the footer card.
 *    onLogout    - () => void, fired when "Log out" is clicked.
 *    children    - the page content, rendered to the right of the sidebar.
 * ------------------------------------------------------------------ */
export default function SidebarLayout({ activeKey, onNavigate, onLogout, children }) {
  const [internalActive, setInternalActive] = useState(() => {
    if (activeKey) return activeKey;
    if (typeof window !== "undefined") {
      const match = NAV_ITEMS.find((i) => window.location.pathname.startsWith(i.href));
      if (match) return match.key;
    }
    return "dashboard";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = activeKey ?? internalActive;

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  const handleSelect = (item) => {
    if (!activeKey) setInternalActive(item.key);
    setMobileOpen(false);
    if (onNavigate) onNavigate(item);
  };

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile top bar with menu toggle */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-[#E4E0D6] bg-[#F7F5F0]/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-[#E4E0D6] bg-white p-2 text-[#1C2B33] hover:border-[#2F6F63]/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div
          className="text-sm font-semibold text-[#1C2B33]"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Shop admin
        </div>
      </div>

      {/* Backdrop (mobile) */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-[#1C2B33]/40 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar panel — fixed drawer on mobile, sticky column on desktop */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[#E4E0D6] bg-[#F7F5F0] transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#E4E0D6] px-5 py-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1C2B33] text-xs font-semibold text-[#F7F5F0]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              SH
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-[#1C2B33]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Shop admin
              </p>
              <p className="truncate text-[11px] text-[#5C6B73]">Management console</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-[#5C6B73] hover:bg-[#E4E0D6]/60 md:hidden"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

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
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#2F6F63]/10 text-[#2F6F63]"
                        : "text-[#5C6B73] hover:bg-[#E4E0D6]/60 hover:text-[#1C2B33]"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2.5 border-t border-[#E4E0D6] px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2F6F63]/10 text-xs font-semibold text-[#2F6F63]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#1C2B33]">
              {user?.name || "Admin user"}
            </p>
            <p className="truncate text-[11px] text-[#5C6B73]">{user?.contact || ""}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="shrink-0 rounded-md p-1.5 text-[#5C6B73] hover:bg-[#B23A34]/10 hover:text-[#B23A34] transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Page content — this is where each page's children render */}
      <div className="min-w-0 pt-14 md:pt-0 md:ml-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo — shows the layout in action. Replace with your real pages.  */
/* ------------------------------------------------------------------ */
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
        This is your page content. Everything inside &lt;SidebarLayout&gt; renders here,
        to the right of the sidebar, with the mobile drawer handled for you.
      </p>
    </div>
  );
}

export function SidebarLayoutDemo() {
  const [active, setActive] = useState("dashboard");
  return (
    <SidebarLayout
      activeKey={active}
      onNavigate={(item) => setActive(item.key)}
      user={{ name: "Amina Raza", contact: "amina@shop.com" }}
      onLogout={() => alert("Logged out")}
    >
      <DemoPage title={NAV_ITEMS.find((i) => i.key === active)?.label} />
    </SidebarLayout>
  );
}