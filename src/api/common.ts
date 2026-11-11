import { ArgumentsHost, Catch, ExceptionFilter, CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';
import { verify } from 'jsonwebtoken';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { Actor, DomainError } from '../domain/errors';
export function env(name: string) { const v=process.env[name]; if(!v) throw new Error('Missing configuration: '+name); return v; }
export function secretMatches(a: unknown,b: string) { return typeof a==='string' && Buffer.byteLength(a)===Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b)); }
export function actor(req: any): Actor { return req.actor; }
export function bearer(req: any) { return String(req.headers.authorization || '').replace(/^Bearer /,''); }
@Injectable()
export class AccessGuard implements CanActivate {
 canActivate(ctx: ExecutionContext) {
  const req=ctx.switchToHttp().getRequest();
  if(req.path==='/health') return true;
  const internal=secretMatches(req.headers['x-service-key'],env('INTERNAL_API_KEY'));
  if(process.env.REQUIRE_SERVICE_KEY==='true' && !internal) throw new DomainError(401,'Acesso de serviço inválido.');
  if(req.path.startsWith('/internal/')) { if(!internal) throw new DomainError(401,'Acesso de serviço inválido.'); return true; }
  if(['/auth/login','/auth/register'].includes(req.path)) return true;
  try { const p=verify(bearer(req),env('JWT_SECRET'),{algorithms:['HS256'],issuer:'smartpark',audience:'smartpark-api'}) as any;
   if(!p.sub || !['driver','admin'].includes(p.role)) throw new Error(); req.actor={sub:p.sub,role:p.role}; return true;
  } catch { throw new DomainError(401,'Faça login para continuar.'); }
 }
}
@Catch()
export class Errors implements ExceptionFilter {
 catch(error: any, host: ArgumentsHost) { const req=host.switchToHttp().getRequest(); const res=host.switchToHttp().getResponse();
  const status=error instanceof DomainError ? error.status : error instanceof ZodError ? 400 : error instanceof HttpException ? error.getStatus() : 500;
  if(status===500) console.error(JSON.stringify({level:'error',correlationId:req.correlationId,error:error?.name}));
  res.status(status).json({error:status===500?'Erro interno. Tente novamente.':error instanceof ZodError?'Dados inválidos.':error.message,details:error instanceof ZodError?error.issues.map(i=>({path:i.path,message:i.message})):undefined,correlationId:req.correlationId});
 }
}
export function correlation(req:any,res:any,next:any){ const incoming=req.headers['x-correlation-id']; req.correlationId=typeof incoming==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(incoming)?incoming:randomUUID(); res.setHeader('x-correlation-id',req.correlationId); const start=Date.now(); res.on('finish',()=>console.log(JSON.stringify({method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-start,correlationId:req.correlationId}))); next(); }
