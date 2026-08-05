const http = require('https');
http.get("https://8uqf5doi.api.sanity.io/v2023-05-03/data/query/production?query=array::unique(*[_type=='product'].category)", (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(JSON.stringify(JSON.parse(data).result, null, 2)); });
});
