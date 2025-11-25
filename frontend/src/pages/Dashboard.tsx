import { logout } from "../utils/axiosInstance";

const Dashboard = () => {
  return (
    <div className="relative w-full bg-zinc-950 text-zinc-50">
      {/* Gradient tylko po lewej stronie */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,_rgba(255,138,0,0.32),transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(255,90,0,0.4),transparent_60%)]" />

      <header className="relative border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Proscientia Dashboard
            </h1>
            <p className="text-xs text-zinc-400">
              Podgląd agentów AI, danych ERP/MES i dokumentów.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:border-zinc-500 hover:bg-zinc-800/80 transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-lg font-semibold mb-2">
            Witaj w panelu Proscientia
          </h2>
          <p className="text-sm text-zinc-300">
            To będzie główna strona aplikacji – podgląd agentów AI, danych
            ERP/MES, dokumentów oraz wyników testów wiedzy. Na razie jest tu
            tylko podstawowy layout i przycisk wylogowania.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
