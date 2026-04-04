const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default async function Icon() {
  try {
    const settingsResponse = await fetch(`${API_BASE}/api/settings`, {
      next: { revalidate: 60 },
    });

    if (!settingsResponse.ok) {
      return new Response(null, { status: 204 });
    }

    const settings = await settingsResponse.json();
    const faviconUrl = settings?.favicon_url;

    if (!faviconUrl) {
      return new Response(null, { status: 204 });
    }

    const faviconResponse = await fetch(faviconUrl, {
      next: { revalidate: 60 },
    });

    if (!faviconResponse.ok) {
      return new Response(null, { status: 204 });
    }

    const contentType = faviconResponse.headers.get('content-type') || 'image/x-icon';
    const arrayBuffer = await faviconResponse.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
