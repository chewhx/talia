import { fetchCalendarEvents } from "@/utils/calendar";
import { redirect } from "next/navigation";
import { ReactNode, cache } from "react";
import UserData from "../../mock-user-data/user-data.json";
import { getCookie } from "../actions";
import ChatContainer from "./chatContainer";

const getCalendarEvents = cache(async (calendarIDs: string[]) => {
  return await fetchCalendarEvents(calendarIDs);
});

export default async function Layout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const userEmail = (await getCookie("user_email")) as keyof typeof UserData;
  if (!userEmail || !UserData?.[userEmail]) {
    console.error(`Invalid user email: ${userEmail}`);
    redirect("/");
  }

  const userDetails = UserData[userEmail];
  const events = await getCalendarEvents(userDetails.calendarIDs);

  return <ChatContainer events={events}>{children}</ChatContainer>;
}
