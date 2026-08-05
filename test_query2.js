const http = require('https');
http.get("https://8uqf5doi.api.sanity.io/v2023-05-03/data/query/production?query=*[_type=='product'%26%26defined(colors)][0..10]", (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { 
    const products = JSON.parse(data).result;
    for(const p of products) {
      console.log(`Product: ${p.name}`);
      console.log(`Colors array:`, JSON.stringify(p.colors));
      if (p.images) {
         console.log(`Images color field:`, p.images.map(img => img.color));
      }
    }
  });
});
