const https = require('https');

exports.handler = async function(event) {
  const path = event.path;
  let fullUrl = '';

  if (path.includes('/api/polygon/')) {
    const polygonPath = path.replace('/api/polygon/', '');
    const query = event.queryStringParameters
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '';
    fullUrl = `https://api.polygon.io/${polygonPath}${query}`;
  } else if (path.includes('/api/alpha/')) {
    const params = event.queryStringParameters
      ? '?' + new URLSearchParams(event.queryStringParameters).toString()
      : '';
    fullUrl = `https://www.alphavantage.co/query${params}`;
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid route' }) };
  }

  return new Promise((resolve) => {
    https.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: data
        });
      });
    }).on('error', (e) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: e.message })
      });
    });
  });
};
