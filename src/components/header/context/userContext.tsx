// UserContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";

interface UserContextType {
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDisplayName = async () => {
      const displayNameFromCookies = Cookies.get("user-displayName");
      if (displayNameFromCookies) {
        setDisplayName(displayNameFromCookies);
      }
      setIsLoading(false);
    };

    loadDisplayName();
  }, []);

  return (
    <UserContext.Provider value={{ displayName, setDisplayName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
