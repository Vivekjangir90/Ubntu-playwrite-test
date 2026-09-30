export default async () => {
  return new Response(JSON.stringify({
    ok: true,
    runtime: "Netlify Function",
    message: "Function is running"
  }), {
    headers: { "content-type": "application/json" }
  });
};
