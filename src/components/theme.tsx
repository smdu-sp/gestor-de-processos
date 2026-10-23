"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
type Theme = "light" | "dark" | "system";
const Context = createContext<{
  dark: boolean;
  setTheme: (theme: Theme) => void;
}>({ dark: false, setTheme: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gestao-login-theme");
      if (saved === "light" || saved === "dark" || saved === "system")
        updateTheme(saved);
    } catch {}
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? media.matches : theme === "dark";
      setDark(resolved);
      document.documentElement.dataset.theme = resolved ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  function setTheme(value: Theme) {
    updateTheme(value);
    try {
      localStorage.setItem("gestao-login-theme", value);
    } catch {}
  }
  return (
    <Context.Provider value={{ dark, setTheme }}>{children}</Context.Provider>
  );
}
export const useTheme = () => useContext(Context);
export function ThemeToggle() {
  const { dark, setTheme } = useTheme();
  return (
    <details className="app-theme">
      <summary aria-label="Alterar tema" role="button">
        {dark ? <Moon size={17} /> : <Sun size={17} />}
      </summary>
      <div className="app-theme-menu">
        {(
          [
            ["light", "Claro"],
            ["dark", "Escuro"],
            ["system", "Sistema"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={(event) => {
              setTheme(value);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </details>
  );
}
