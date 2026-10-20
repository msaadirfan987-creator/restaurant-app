import { createContext, useContext } from "react";

export const AdminContext = createContext({
  user: null,
  setUser: () => {},
  navigate: () => {},
  notify: () => {},
  fail: () => {},
});

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminContext.Provider");
  }
  return ctx;
}
