import { getCookie } from "@/app/actions";
import { useRouter } from "next/router";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import UserData from "../config/user-data.json";
import { CalendarEvent } from "@/utils/calendar";

interface UserContextType {
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  isLoading: boolean;
  calendarEvents: CalendarEvent[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{
  calendarEvents: CalendarEvent[];
  children: ReactNode;
}> = ({ calendarEvents, children }) => {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDisplayName = async () => {
      const userEmail = (await getCookie(
        "user_email"
      )) as keyof typeof UserData;

      if (!userEmail || !UserData?.[userEmail]) {
        useRouter().push("/");
      }

      const userDetails = UserData?.[userEmail];
      setDisplayName(userDetails.displayName);
      setIsLoading(false);
    };

    loadDisplayName();
  }, []);

  return (
    <UserContext.Provider
      value={{
        displayName,
        calendarEvents,
        setDisplayName,
        isLoading,
      }}
    >
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
