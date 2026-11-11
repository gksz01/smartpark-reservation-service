import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
import {emitReservationEvent} from '../../emit-reservation-event';
export class CreateReservation{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,input:{parkingId:string;vehicleId:string;start:string;end:string},token:string,correlationId:string){
  period(input.start,input.end);await this.catalog.verify(input.parkingId,input.vehicleId,token);
  return this.store.transact(input.parkingId,async tx=>{const config=await tx.capacity();if(!config)throw new DomainError(409,'Estacionamento ainda sem capacidade configurada.');
   if(available(config,await tx.reservations(),input.start,input.end)<1)throw new DomainError(409,'Sem capacidade para esse período.');
   const value:Reservation={...input,id:randomUUID(),userId:actor.sub,status:'reserved',amountCents:amount(input.start,input.end,config.hourlyRateCents),createdAt:new Date().toISOString()};await tx.save(value);await emitReservationEvent(tx,value,'ReservaCriada',correlationId);return value;
  });
 }
}
