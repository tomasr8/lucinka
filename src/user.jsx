import { createContext, useContext } from "react";

import { useData } from "./util";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const {
    data: { user },
  } = useData("user");
  const isAdmin = user?.is_admin || false;

  return (
    <UserContext.Provider value={{ isAdmin }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
