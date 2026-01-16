import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ExecuteBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await response.text();

    // Parse Open Graph and meta tags
    const getMetaContent = (html: string, property: string): string | null => {
      // Try og: property first
      const ogMatch = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i')
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i')
      );
      if (ogMatch) return ogMatch[1];

      // Try twitter: property
      const twitterMatch = html.match(
        new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']*)["']`, 'i')
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:${property}["']`, 'i')
      );
      if (twitterMatch) return twitterMatch[1];

      // Try standard meta name
      const metaMatch = html.match(
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i')
      );
      if (metaMatch) return metaMatch[1];

      return null;
    };

    // Get title from og:title, twitter:title, or <title> tag
    let title = getMetaContent(html, 'title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    // Get description
    const description = getMetaContent(html, 'description');

    // Get image
    const image = getMetaContent(html, 'image');

    // Get site name
    const siteName = getMetaContent(html, 'site_name');

    // Get favicon
    const parsedUrl = new URL(url);
    let favicon = `${parsedUrl.origin}/favicon.ico`;

    // Try to find apple-touch-icon or other favicon declarations
    const faviconMatch = html.match(
      /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']*)["']/i
    ) || html.match(
      /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i
    );

    if (faviconMatch) {
      const faviconHref = faviconMatch[1];
      if (faviconHref.startsWith('http')) {
        favicon = faviconHref;
      } else if (faviconHref.startsWith('//')) {
        favicon = `https:${faviconHref}`;
      } else if (faviconHref.startsWith('/')) {
        favicon = `${parsedUrl.origin}${faviconHref}`;
      } else {
        favicon = `${parsedUrl.origin}/${faviconHref}`;
      }
    }

    return NextResponse.json({
      title: title || parsedUrl.hostname,
      description: description || null,
      image: image || null,
      siteName: siteName || parsedUrl.hostname,
      favicon,
      domain: parsedUrl.hostname,
    });
  } catch (error) {
    // Return basic info on error
    try {
      const parsedUrl = new URL(url);
      return NextResponse.json({
        title: parsedUrl.hostname,
        description: null,
        image: null,
        siteName: parsedUrl.hostname,
        favicon: `${parsedUrl.origin}/favicon.ico`,
        domain: parsedUrl.hostname,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }
}
