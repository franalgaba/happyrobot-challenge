import type { Theme } from "../theme";

type ThemeSwitcherProps = {
  theme: Theme;
  onToggle: () => void;
};

export function ThemeSwitcher({ theme, onToggle }: ThemeSwitcherProps) {
  const isLight = theme === "light";
  const ariaLabel = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button type="button" className="theme-btn" onClick={onToggle} aria-label={ariaLabel}>
      <span className="theme-btn-icon" aria-hidden>
        {isLight ? <MoonIcon /> : <SunIcon />}
      </span>
      <span className="theme-btn-label">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
