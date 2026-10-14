"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { MotionConfig } from "motion/react";
type Theme = "light" | "dark" | "system";
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (v: Theme) => void;
}>({ theme: "system", setTheme: () => {} });
export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("campus-theme");
      if (stored === "light" || stored === "dark") setThemeState(stored);
    } catch {
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const value =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = value;
      document.documentElement.style.colorScheme = value;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  const setTheme = (value: Theme) => {
    setThemeState(value);
    try {
      localStorage.setItem("campus-theme", value);
    } catch {}
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
}
export function ThemeSwitch() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <div className="theme-switch" role="group" aria-label="Appearance">
      {(
        [
          { value: "light", Icon: Sun },
          { value: "dark", Icon: Moon },
          { value: "system", Icon: Monitor },
        ] as const
      ).map(({ value, Icon }) => (
        <button
          key={value}
          aria-label={`${value[0].toUpperCase() + value.slice(1)} theme`}
          aria-pressed={theme === value}
          title={`${value} theme`}
          onClick={() => setTheme(value)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
