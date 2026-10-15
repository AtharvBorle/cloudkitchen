import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../src/lib/swagger-spec';

function findRoutes(dir: string, base: string = ''): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findRoutes(fullPath, path.join(base, file)));
    } else if (file === 'route.ts' || file === 'route.js') {
      const apiPath = '/api/' + base.replace(/\\/g, '/');
      results.push(apiPath);
    }
  }
  return results;
}

const apiRoutes = findRoutes(path.join(__dirname, '../src/app/api'));
const swaggerPaths = Object.keys(swaggerSpec.paths);

console.log('Total API routes found in filesystem:', apiRoutes.length);
console.log('Total paths in Swagger spec:', swaggerPaths.length);

const missingFromSwagger = apiRoutes.filter(r => {
  const openApiPath = r.replace(/\[(\w+)\]/g, '{$1}').replace(/\[\.\.\.(\w+)\]/g, '{$1}');
  return !swaggerPaths.includes(openApiPath) && !swaggerPaths.includes(r);
});

console.log('\n--- Routes in Filesystem but MISSING from Swagger (' + missingFromSwagger.length + ') ---');
missingFromSwagger.forEach(r => console.log(r));

console.log('\n--- Checking Missing HTTP Methods on Existing Routes ---');
function checkMethods(dir: string, base: string = '') {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      checkMethods(full, path.join(base, f));
    } else if (f === 'route.ts' || f === 'route.js') {
      const content = fs.readFileSync(full, 'utf8');
      const apiPath = '/api/' + base.replace(/\\/g, '/');
      const openApiPath = apiPath.replace(/\[(\w+)\]/g, '{$1}').replace(/\[\.\.\.(\w+)\]/g, '{$1}');
      const exportedMethods: string[] = [];
      if (/export\s+async\s+function\s+GET/i.test(content)) exportedMethods.push('get');
      if (/export\s+async\s+function\s+POST/i.test(content)) exportedMethods.push('post');
      if (/export\s+async\s+function\s+PUT/i.test(content)) exportedMethods.push('put');
      if (/export\s+async\s+function\s+DELETE/i.test(content)) exportedMethods.push('delete');
      if (/export\s+async\s+function\s+PATCH/i.test(content)) exportedMethods.push('patch');

      const specPath = (swaggerSpec.paths as any)[openApiPath] || (swaggerSpec.paths as any)[apiPath];
      if (specPath) {
        const specMethods = Object.keys(specPath);
        for (const m of exportedMethods) {
          if (!specMethods.includes(m)) {
            console.log(`Path ${openApiPath} exports ${m.toUpperCase()} but MISSING in Swagger spec!`);
          }
        }
      }
    }
  }
}
checkMethods(path.join(__dirname, '../src/app/api'));
