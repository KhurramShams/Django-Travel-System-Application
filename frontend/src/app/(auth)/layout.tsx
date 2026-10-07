import React from "react";
import { Plane, Compass, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white">
      {/* Background geometric pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#15803d 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header Brand */}
      <div className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-900/40">
          <Plane className="h-6 w-6 -rotate-45" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Karwan-e-Asotvi Travels
          </h1>
          <p className="text-xs text-emerald-400 font-medium">
            Enterprise Hajj, Umrah & Travel Management
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="relative z-10 w-full max-w-md">{children}</main>

      {/* Security Assurance Footer */}
      <footer className="relative z-10 mt-8 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Secured by Supabase Auth & Django RBAC Architecture</span>
      </footer>
    </div>
  );
}
