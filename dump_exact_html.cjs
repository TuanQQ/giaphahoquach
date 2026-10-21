const fs = require('fs');
const html = fs.readFileSync('D:\\Project\\giaphahoquach\\demo475_phado.html', 'utf8');

const banner = html.match(/<div class="header header-giapha">[\s\S]*?<\/nav>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i);
if (banner) console.log('HEADER HTML:\n', banner[0]);

const tools = html.match(/<div class="phado-tools[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i);
if (tools) console.log('\nTOOLS HTML:\n', tools[0]);
