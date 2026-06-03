import type { Theme } from "../theme";

type HappyRobotLogoProps = {
  theme: Theme;
  className?: string;
};

const LOGO_BY_THEME: Record<Theme, string> = {
  light: "/happyrobot-logo-light.png",
  dark: "/happyrobot-logo-dark.png",
};

export function HappyRobotLogo({ theme, className }: HappyRobotLogoProps) {
  return (
    <img
      className={className}
      src={LOGO_BY_THEME[theme]}
      alt="HappyRobot"
      width={268}
      height={41}
      decoding="async"
    />
  );
}
