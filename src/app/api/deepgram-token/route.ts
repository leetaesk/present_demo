export const runtime = 'edge';

export async function POST() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'DEEPGRAM_API_KEY is not configured' },
      { status: 500 },
    );
  }

  const res = await fetch('https://api.deepgram.com/v1/auth/grant', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl_seconds: 30 }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json(
      { error: 'Failed to grant Deepgram token', detail },
      { status: res.status },
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return Response.json({ token: data.access_token, expiresIn: data.expires_in });
}
