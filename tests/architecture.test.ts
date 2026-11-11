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
