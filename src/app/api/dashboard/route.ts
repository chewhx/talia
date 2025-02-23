import { createClient } from "@/utils/supabase/client";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => c.split("="))
    );

    const userID = cookies["user-id"];
    if (!userID) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const supabase = createClient();
    const { data: userContent, error } = await supabase
      .from("contents")
      .select(
        `
      id,
      user_id,
      docs_url,
      status,
      created_at,
      updated_at,
      users(name, role),
      approvals(decision)
    `
      )
      .eq("user_id", userID);

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(userContent), { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
