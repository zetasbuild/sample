import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const target = searchParams.get('url');

  if (!target) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target.startsWith('http') ? target : `https://${target}`);
  } catch {
    return new NextResponse('Invalid URL format', { status: 400 });
  }

  const settings = getSettings();
  if (!settings.enabled) {
    return new NextResponse('Proxy bypass is disabled in admin settings', { status: 403 });
  }

  try {
    const response = await fetch(parsedTarget.toString(), {
      headers: {
        'User-Agent': settings.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    const responseHeaders = new Headers();

    // Set permissive CORS and safe embed headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Content-Type', contentType);

    // OMIT X-Frame-Options and Content-Security-Policy to allow display in iframe!

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseTag = `<base href="${response.url || parsedTarget.toString()}">`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      return new NextResponse(html, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unable to load website</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 3rem 1.5rem; text-align: center; }
          .card { max-width: 480px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; }
          h2 { color: #f87171; margin-top: 0; font-size: 1.25rem; }
          p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
          .btn { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.2rem; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Website Load Error</h2>
          <p>Could not fetch target page via proxy (${message}).</p>
          <a class="btn" href="${parsedTarget.toString()}" target="_blank" rel="noopener noreferrer">Open in New Tab</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(fallbackHtml, {
      status: 502,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

