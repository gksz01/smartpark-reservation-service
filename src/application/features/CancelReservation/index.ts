import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
import {GetReservation} from '../GetReservation';
import {emitReservationEvent} from '../../emit-reservation-event';
export class CancelReservation{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,id:string,correlationId:string){const existing=await new GetReservation(this.store,this.catalog).execute(actor,id);return this.store.transact(existing.parkingId,async tx=>{const value=(await tx.reservations()).find(r=>r.id===id)!;own(actor,value.userId);if(value.status==='cancelled')return value;if(Date.parse(value.start)<=Date.now())throw new DomainError(409,'Não é possível cancelar uma reserva já iniciada.');const changed={...value,status:'cancelled' as const};await tx.save(changed);await emitReservationEvent(tx,changed,'ReservaCancelada',correlationId);return changed;});}
}
