export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams.toString();

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    let targetUrl = '';
    let proxyRequest;

    if (path.includes('/finnhub/')) {
      const endpoint = path.replace(/.*\/finnhub\//, '');
      targetUrl = `https://finnhub.io/api/v1/${endpoint}${params ? '?' + params : ''}`;
      proxyRequest = new Request(targetUrl, { method: 'GET' });

    } else if (path.includes('/fmp/')) {
      const endpoint = path.replace(/.*\/fmp\//, '');
      targetUrl = `https://financialmodelingprep.com/api/v3/${endpoint}${params ? '?' + params : ''}`;
      proxyRequest = new Request(targetUrl, { method: 'GET' });

    } else if (path.includes('/claude/')) {
      // Proxy to Anthropic API
      const body = await request.text();
      proxyRequest = new Request('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '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',
          'anthropic-version': '2023-06-01',
        },
        body: body
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid route' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      const response = await fetch(proxyRequest);
      const data = await response.text();
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
}
