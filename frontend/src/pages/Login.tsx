import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axiosInstance, { setAuthTokens, getAccessToken } from "../utils/axiosInstance";
import logoLight from "../assets/logo-transparent.png";
import logoDark from "../assets/logo-transparent-white.png";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Jeśli już zalogowany → nie ma sensu wchodzić na /login
  const alreadyAuthed = !!getAccessToken() || !!localStorage.getItem("accessToken");
  if (alreadyAuthed) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await axiosInstance.post("/users/auth/login/", {
        email: email,
        password,
      });

      setAuthTokens({
        access: res.data.access,
        refresh: res.data.refresh,
      });

      navigate("/", { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setErrorMsg("Nieprawidłowy email lub hasło.");
      } else if (err.isApiError) {
        setErrorMsg("Wystąpił problem z logowaniem. Spróbuj ponownie.");
      } else {
        setErrorMsg("Nieoczekiwany błąd. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-100 flex items-center justify-center">
      {/* gradient tła */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,138,0,0.32),transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,90,0,0.4),transparent_55%)]" />

      

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 backdrop-blur-md rounded-2xl shadow-xl shadow-orange-900/30 px-6 py-8 space-y-7"
        >
          <div className="w-full max-w-md px-6">
            <div className="flex flex-col items-center mb-8">
            {/* logo jasne/ciemne */}
                <div className="w-64 mb-4">
                    <img
                        src={logoLight}
                        alt="Proscientia logo"
                        className="hidden dark:hidden w-full h-auto"
                    />
                    <img
                        src={logoDark}
                        alt="Proscientia logo"
                        className="block dark:block w-full h-auto"
                    />
                </div>
                <p className="text-xs text-slate-300 tracking-wide uppercase">
                    Intelligent Manufacturing Knowledge Assistant
                </p>
            </div>
          </div>
          <div className="space-y-2">
          </div>

          <div className="space-y-4">
            {/* EMAIL */}
            <div className="space-y-1 items-start text-left">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-200 px-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1 text-left">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-200 px-1"
              >
                Hasło
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 pr-10 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-1 right-0 flex items-center p1-3 bg-transparent text-slate-400 hover:text-orange-400 hover:border-none"
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 text-slate-950 font-medium text-sm py-2.5 shadow-lg shadow-orange-900/30 hover:from-orange-400 hover:to-amber-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:border-zinc-800"
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Dostęp do systemu jest ograniczony do uprawnionych użytkowników.
          </p>
        </form>
      </div>
  );
};

export default Login;
