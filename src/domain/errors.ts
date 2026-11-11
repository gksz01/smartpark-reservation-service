export class DomainError extends Error {
 constructor(public readonly status: number, message: string) { super(message); }
}
export type Actor = { sub: string; role: 'driver' | 'admin' };
export function requireAdmin(actor: Actor) { if(actor.role !== 'admin') throw new DomainError(403, 'Acesso exclusivo de administradores.'); }
export function own(actor: Actor, userId: string) { if(actor.role !== 'admin' && actor.sub !== userId) throw new DomainError(404, 'Registro não encontrado.'); }
