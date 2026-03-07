const https = require('https');

exports.handler = async function(event) {
  const path = event.path || '';
  const params = event.queryStringParameters || {};
  let fullUrl = '';

  if (path.includes('/finnhub/')) {
    const endpoint = path.replace(/.*\/finnhub\//, '');
    const qs = new URLSearchParams(params).toString();
    fullUrl = `https://finnhub.io/api/v1/${endpoint}${qs ? '?' + qs : ''}`;

  } else if (path.includes('/fmp/')) {
    const endpoint = path.replace(/.*\/fmp\//, '');
    const qs = new URLSearchParams(params).toString();
    fullUrl = `https://financialmodelingprep.com/api/v3/${endpoint}${qs ? '?' + qs : ''}`;

  } else if (path.includes('/alpha/')) {
    const qs = new URLSearchParams(params).toString();
    fullUrl = `https://www.alphavantage.co/query${qs ? '?' + qs : ''}`;

  } else {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid route', path })
    };
  }

  return new Promise((resolve) => {
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: data
      }));
    }).on('error', (e) => resolve({
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    }));
  });
};
