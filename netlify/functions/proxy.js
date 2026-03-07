const https = require('https');

exports.handler = async function(event) {
  const path = event.path || '';
  const params = event.queryStringParameters || {};

  let fullUrl = '';

  if (path.includes('polygon')) {
    const polygonPath = path.replace(/.*\/api\/polygon\//, '').replace(/.*proxy\/polygon\//, '');
    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    fullUrl = `https://api.polygon.io/${polygonPath}${query}`;
  } else if (path.includes('alpha')) {
    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    fullUrl = `https://www.alphavantage.co/query${query}`;
  } else {
    // Log what we received to help debug
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid route', path: path, params: params })
    };
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
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message, url: fullUrl })
      });
    });
  });
};
