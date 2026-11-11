import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
import {GetReservation} from '../GetReservation';
import {emitReservationEvent} from '../../emit-reservation-event';
export class PayReservation{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,id:string,result:'approved'|'declined',correlationId:string){const existing=await new GetReservation(this.store,this.catalog).execute(actor,id);return this.store.transact(existing.parkingId,async tx=>{const value=(await tx.reservations()).find(r=>r.id===id)!;own(actor,value.userId);if(value.status==='cancelled')throw new DomainError(409,'Reserva cancelada.');if(value.status==='paid')return {reservation:value,paymentStatus:'approved',simulated:true};if(Date.parse(value.end)<=Date.now())throw new DomainError(409,'Reserva expirada.');if(result==='declined')return {reservation:value,paymentStatus:'declined',simulated:true};const changed={...value,status:'paid' as const};await tx.save(changed);await emitReservationEvent(tx,changed,'PagamentoConfirmado',correlationId);return {reservation:changed,paymentStatus:'approved',simulated:true};});}
}
