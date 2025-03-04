import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/dashboard"];

const AUTH_ROUTES = ["/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => path.startsWith(route) || path === route
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => path.startsWith(route) || path === route
  );

  if (!user && isProtectedRoute) {
    const searchParams = new URLSearchParams({
      returnTo: path,
    });

    return NextResponse.redirect(
      new URL(`/login?${searchParams}`, request.url)
    );
  }

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", user.id)
      .single();

    if (userData) {
      const { name, role } = userData;
      const extractFromEmail = user.email?.split("@")[0];
      const cookieOptions = { httpOnly: false, path: "/" };

      supabaseResponse.cookies.set(
        "user-displayName",
        name ?? extractFromEmail,
        cookieOptions
      );
      supabaseResponse.cookies.set("user-id", user.id, cookieOptions);
      supabaseResponse.cookies.set("user-role", role, cookieOptions);
    }
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
