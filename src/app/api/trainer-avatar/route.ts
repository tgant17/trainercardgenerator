const TRAINER_BASE_URL = "https://play.pokemonshowdown.com/sprites/trainers/";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sprite = url.searchParams.get("sprite");

  if (!sprite) {
    return new Response("Missing sprite param", { status: 400 });
  }

  const target = `${TRAINER_BASE_URL}${encodeURIComponent(sprite)}`;

  const upstream = await fetch(target);
  if (!upstream.ok) {
    return new Response("Avatar not found", { status: upstream.status });
  }

  const arrayBuffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "image/png";

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
