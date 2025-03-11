"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import UserData from "../mock-user-data/user-data.json";

const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

export async function setPasswordCookie(formData: FormData) {
  const talia_password = formData.get("talia-password") as string;
  const cookieStore = cookies();

  cookieStore.set("talia_password", talia_password, {
    maxAge: COOKIE_MAX_AGE,
  });

  redirect("/main");
}

export async function verifyUserAuthStatus() {
  const userEmail = await getCookie("user_email");

  if (!userEmail || !(userEmail in UserData)) {
    console.log(
      `User authentication failed. Email: ${userEmail || "Not provided"}`
    );
    redirect("/");
  }

  console.log(`User authenticated successfully. Email: ${userEmail}`);
}

export async function setUserCookie(formData: FormData) {
  const userEmail = formData.get("user_email") as string;

  if (userEmail in UserData) {
    setCookie("user_email", userEmail, {
      maxAge: COOKIE_MAX_AGE,
    });
    redirect("/main");
  }
  redirect("/");
}

export async function getAllCookies() {
  return cookies().getAll();
}

export async function getCookie(key: string): Promise<string | null> {
  return cookies().get(key)?.value ?? null;
}

export async function setCookie(
  key: string,
  value: string,
  options: Record<string, any> = {}
) {
  cookies().set(key, value, options);
}

export async function clearCookies() {
  const allCookies = await getAllCookies();
  allCookies.forEach((cookie) => cookies().delete(cookie.name));
}

export async function deleteCookie(key: string) {
  cookies().delete(key);
}
