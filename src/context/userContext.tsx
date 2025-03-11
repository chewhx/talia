"use client";
import { getCookie } from "@/app/actions";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import UserData from "../mock-user-data/user-data.json";
import { CalendarEvent } from "@/utils/calendar";
import { useRouter } from "next/navigation";

export type UserDataProps = {
  username: string;
  displayName: string;
  emailAddress: string;
  HODName: string;
  HODEmail: string;
  calendarIDs: string[];
};

type UserContextType = {
  userDetails: UserDataProps | null;
  isLoading: boolean;
  calendarEvents: CalendarEvent[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{
  calendarEvents?: CalendarEvent[];
  children: ReactNode;
}> = ({ calendarEvents = [], children }) => {
  const [userDetails, setUserDetails] = useState<UserDataProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDisplayName = async () => {
      try {
        const userEmail = await getCookie("user_email");

        if (!userEmail || !(userEmail in UserData)) {
          router.push("/");
          return;
        }

        setUserDetails(UserData[userEmail as keyof typeof UserData] ?? null);
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadDisplayName();
  }, [router]);

  const contextValue = React.useMemo(
    () => ({
      userDetails,
      calendarEvents,
      isLoading,
    }),
    [calendarEvents, isLoading, userDetails]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
