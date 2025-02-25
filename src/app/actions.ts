"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setPasswordCookie(formData: FormData) {
  // const talia_password = formData.get("talia-password");
  const talia_password = "abcd1234";
  const cookieStore = cookies();

  cookieStore.set("talia_password", String(talia_password) || "", {
    maxAge: 60 * 60 * 24 * 24, // 24 days in seconds
  });

  redirect("/main");
}
