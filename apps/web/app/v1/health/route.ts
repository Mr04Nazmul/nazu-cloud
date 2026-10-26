export async function GET() {
  return Response.json(
    {
      service: "nazu-cloud-web",
      status: "responding",
      dependencies: "not_checked",
      version: "0.1.0",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
