import { createContext, useContext, type ReactNode } from "react";

const DashboardMotionContext = createContext(false);

type DashboardMotionProviderProps = {
  subtleNumbers: boolean;
  children: ReactNode;
};

export function DashboardMotionProvider({ subtleNumbers, children }: DashboardMotionProviderProps) {
  return (
    <DashboardMotionContext.Provider value={subtleNumbers}>{children}</DashboardMotionContext.Provider>
  );
}

export function useSubtleNumberAnimation(): boolean {
  return useContext(DashboardMotionContext);
}
