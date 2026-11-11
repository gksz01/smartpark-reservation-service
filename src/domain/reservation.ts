import { DomainError } from './errors';
export type Reservation={id:string;userId:string;parkingId:string;vehicleId:string;start:string;end:string;status:'reserved'|'paid'|'cancelled';amountCents:number;createdAt:string};
export type Capacity={parkingId:string;capacity:number;hourlyRateCents:number};
export type IntegrationEvent={eventId:string;version:1;type:'ReservaCriada'|'ReservaCancelada'|'PagamentoConfirmado';userId:string;reservationId:string;occurredAt:string;correlationId:string};
export function period(start:string,end:string,now=Date.now()){
 const a=Date.parse(start),b=Date.parse(end);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||a<now-60000||b-a>30*86400000)throw new DomainError(400,'Período inválido: início futuro, fim posterior e duração máxima de 30 dias.');
}
export function peak(reservations:Pick<Reservation,'start'|'end'|'status'>[],start?:string,end?:string){
 const lo=start?Date.parse(start):-Infinity,hi=end?Date.parse(end):Infinity;
 const events:[number,number][]=[];
 for(const r of reservations){if(r.status==='cancelled')continue;const a=Math.max(lo,Date.parse(r.start)),b=Math.min(hi,Date.parse(r.end));if(a<b)events.push([a,1],[b,-1]);}
 events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let current=0,max=0;for(const [,delta]of events){current+=delta;max=Math.max(max,current);}return max;
}
export function amount(start:string,end:string,rate:number){return Math.ceil((Date.parse(end)-Date.parse(start))/3600000)*rate;}
export function available(config:Capacity,rows:Reservation[],start:string,end:string){return Math.max(0,config.capacity-peak(rows,start,end));}
