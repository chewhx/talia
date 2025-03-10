"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import data from "../config/user-data.json";

export async function setPasswordCookie(formData: FormData) {
  const talia_password = formData.get("talia-password");
  const cookieStore = cookies();

  cookieStore.set("talia_password", String(talia_password) || "", {
    maxAge: 60 * 60 * 24 * 24, // 24 days in seconds
  });

  redirect("/main");
}

export async function verifyUserAuthStatus() {
  const cookieStore = cookies();
  const userEmail = cookieStore.get("user_email")?.value;

  if (!userEmail) {
    redirect("/");
  }
}

export async function setUserCookie(formData: FormData) {
  const userEmail = formData.get("user_email");

  if (data?.[userEmail as keyof typeof data]) {
    const cookieStore = cookies();

    cookieStore.set("user_email", String(userEmail) || "", {
      maxAge: 60 * 60 * 24 * 24, // 24 hours
    });

    redirect("/main");
  }

  redirect("/");
}

// Function to get all cookies
export async function getAllCookies() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  return allCookies; // Returns an array of all cookies
}

// Function to get a specific cookie by key
export async function getCookie(key: string) {
  const cookieStore = cookies();
  return cookieStore.get(key)?.value || null; // Returns the cookie value or null if not found
}

// Function to set a specific cookie
export async function setCookie(
  key: string,
  value: string,
  options: Record<string, any> = {}
) {
  const cookieStore = cookies();
  cookieStore.set(key, value, options); // Options like { httpOnly: true, secure: true, maxAge: 3600 }
}

// Function to clear all cookies (remove cookies)
export async function clearCookies() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name); // Delete each cookie
  });
}

// Function to delete a specific cookie
export async function deleteCookie(key: string) {
  const cookieStore = cookies();
  cookieStore.delete(key); // Deletes the specific cookie
}
