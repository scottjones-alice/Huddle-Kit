import { NextResponse } from "next/server";

import { placeAddress } from "@/lib/google-places";

const PLACE_ID = /^[\w-]{10,200}$/u;
const NOT_FOUND = 404;
const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;

// The address parts for a place chosen from the search.
export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const signedIn = (request.headers.get("cookie") ?? "").includes(
    "huddlekit.session_token"
  );
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (apiKey === undefined || apiKey.length === 0 || !signedIn) {
    return NextResponse.json(
      { message: "Not available" },
      { status: NOT_FOUND }
    );
  }
  if (!PLACE_ID.test(id)) {
    return NextResponse.json({ message: "Not valid" }, { status: BAD_REQUEST });
  }
  try {
    return NextResponse.json({ address: await placeAddress(apiKey, id) });
  } catch {
    return NextResponse.json(
      { message: "Lookup failed" },
      { status: BAD_GATEWAY }
    );
  }
}
