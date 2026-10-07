import Image from "next/image";

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
      <div className="relative z-10 mb-8 flex flex-col items-center text-center gap-3">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-200/80">
          <Image
            src="/logo.png"
            alt="Khas Travels Logo"
            width={80}
            height={80}
            priority
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Khas Travels
          </h1>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">
            Enterprise Hajj, Umrah & Travel Management ERP System
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="relative z-10 w-full max-w-md">{children}</main>

      {/* System Attribution Footer */}
      <footer className="relative z-10 mt-8 flex items-center justify-center text-xs text-slate-400 text-center">
        <span>ERP System Powered by Innosoft Technologies (+92 334 3020868)</span>
      </footer>
    </div>
  );
}
