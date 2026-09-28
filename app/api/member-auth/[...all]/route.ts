import { getMemberAuth } from "@/lib/members/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const auth = getMemberAuth();
  if (!auth) {
    // Public navigation can render signed-out links before membership is configured.
    if (request.method === "GET" && new URL(request.url).pathname === "/api/member-auth/get-session") return Response.json(null, { headers: { "Cache-Control": "private, no-store" } });
    return Response.json({ code: "MEMBERS_UNAVAILABLE", message: "Üyelik hizmeti şu anda kullanılamıyor." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const response = await auth.handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return Response.json({ code: "MEMBERS_UNAVAILABLE", message: "Üyelik hizmeti şu anda kullanılamıyor." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export { handler as GET, handler as POST };
