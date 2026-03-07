javascript
const https = require('https');

exports.handler = async function(event) {
  const target = event.path.replace('/.netlify/functions/proxy/', '');
  const query = event.queryStringParameters 
    ? '?' + new URLSearchParams(event.queryStringParameters).toString() 
    : '';
  
  const urlMap = {
    'polygon': `https://api.polygon.io`,
    'alpha': `https://www.alphavantage.co`
  };

  let fullUrl = '';
  if (target.startsWith('polygon/')) {
    fullUrl = `https://api.polygon.io/${target.replace('polygon/', '')}${query}`;
  } else if (target.startsWith('alpha/')) {
    fullUrl = `https://www.alphavantage.co/${target.replace('alpha/', '')}${query}`;
  } else {
    return { statusCode: 400, body: 'Invalid target' };
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
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
  });
};
```
