import { formatDateTime } from "../lib/format";
import type { Theme } from "../theme";
import { ConnectionStatusPill, type ConnectionStatus } from "./ConnectionStatus";
import { HappyRobotLogo } from "./HappyRobotLogo";
import { ThemeSwitcher } from "./ThemeSwitcher";

type SiteHeaderProps = {
  clientName: string;
  theme: Theme;
  onToggleTheme: () => void;
  lastUpdated: Date | null;
  connectionStatus: ConnectionStatus;
};

export function SiteHeader({
  clientName,
  theme,
  onToggleTheme,
  lastUpdated,
  connectionStatus,
}: SiteHeaderProps) {
  return (
    <header className="site-header hr-enter">
      <a className="brand" href="/" aria-label="HappyRobot dashboard home">
        <HappyRobotLogo theme={theme} className="brand-logo" />
        <span className="brand-client">
          <span className="brand-client-name">{clientName}</span>
          <span className="brand-client-role">Inbound carrier sales</span>
        </span>
      </a>
      <div className="header-meta">
        <div className="header-meta-status">
          <ConnectionStatusPill status={connectionStatus} />
          {lastUpdated ? (
            <span className="header-updated">
              <span className="header-updated-label">Updated</span>
              <time className="header-updated-time mono" dateTime={lastUpdated.toISOString()}>
                {formatDateTime(lastUpdated.toISOString())}
              </time>
            </span>
          ) : null}
        </div>
        <div className="header-meta-actions">
          <ThemeSwitcher theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
