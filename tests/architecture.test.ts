import { describe,it,expect } from 'vitest';
import { readdirSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
const walk=(p:string):string[]=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]);
describe('Clean Architecture',()=>{
 for(const file of walk('src/domain')) it(file+' mantém domínio puro',()=>expect(readFileSync(file,'utf8')).not.toMatch(/from ['"].*(?:@nestjs|mongodb|mssql|infrastructure|application|\/api)/));
 for(const file of walk('src/application')) it(file+' depende apenas de portas e domínio',()=>expect(readFileSync(file,'utf8')).not.toMatch(/from ['"].*(?:@nestjs|mongodb|mssql|infrastructure|\/api)/));
 for(const file of walk('src/api').filter(f=>f.endsWith('controller.ts'))) it(file+' não acessa banco',()=>expect(readFileSync(file,'utf8')).not.toMatch(/(?:\.collection\(|\.query\(|from ['"](?:mongodb|mssql))/));
 it('organiza casos de uso em features',()=>expect(readdirSync('src/application/features').length).toBeGreaterThan(0));
});

const featureRoot='src/application/features';
it('cada slice possui uma operação execute sem transporte ou persistência concreta',()=>{
 const dirs=readdirSync(featureRoot,{withFileTypes:true}).filter(x=>x.isDirectory());
 expect(dirs.length).toBeGreaterThanOrEqual(8);
 for(const dir of dirs){const code=readFileSync(join(featureRoot,dir.name,'index.ts'),'utf8');expect(code).toContain('export class '+dir.name);expect(code.match(/\bexecute\(/g)?.length).toBeGreaterThanOrEqual(1);expect(code).not.toMatch(/from ['"].*(?:@nestjs|mongodb|mssql|infrastructure|\/api)/);}
});
