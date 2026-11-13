import { NextResponse } from "next/server";

import { autocompleteAddresses } from "@/lib/google-places";

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 120;
const UNAUTHORIZED = 401;

// Address search for the onboarding forms. The Google key stays on the server.
// It is only used for people who are signed in, and without a key the search
// reports itself as off so the forms fall back to typing the address.
export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey === undefined || apiKey.length === 0) {
    return NextResponse.json({ enabled: false, suggestions: [] });
  }
  const signedIn = (request.headers.get("cookie") ?? "").includes(
    "huddlekit.session_token"
  );
  if (!signedIn) {
    return NextResponse.json(
      { enabled: false, suggestions: [] },
      { status: UNAUTHORIZED }
    );
  }
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ enabled: true, suggestions: [] });
  }
  try {
    const suggestions = await autocompleteAddresses(apiKey, query);
    return NextResponse.json({ enabled: true, suggestions });
  } catch {
    return NextResponse.json({ enabled: true, suggestions: [] });
  }
}
