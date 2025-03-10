import { fetchCalendarEvents } from "@/utils/calendar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import UserData from "../../config/user-data.json";
import { getCookie } from "../actions";
import ChatContainer from "./chatContainer";

export default async function Layout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const userEmail = (await getCookie("user_email")) as keyof typeof UserData;
  if (!userEmail || !UserData?.[userEmail]) {
    redirect("/");
  }

  const userDetails = UserData[userEmail];
  const calendarsIDs = userDetails.calendarIDs;

  const events = await fetchCalendarEvents(calendarsIDs);

  return <ChatContainer events={events}>{children}</ChatContainer>;
}
