import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
import {GetReservation} from '../GetReservation';
export class UpdateReservation{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,id:string,input:{start:string;end:string},correlationId:string){period(input.start,input.end);const existing=await new GetReservation(this.store,this.catalog).execute(actor,id);return this.store.transact(existing.parkingId,async tx=>{const rows=await tx.reservations();const value=rows.find(r=>r.id===id)!;own(actor,value.userId);if(value.status!=='reserved')throw new DomainError(409,'Somente reservas não pagas podem ser alteradas.');const config=await tx.capacity();if(!config)throw new DomainError(409,'Capacidade indisponível.');if(available(config,rows.filter(r=>r.id!==id),input.start,input.end)<1)throw new DomainError(409,'Sem capacidade para esse período.');const changed={...value,...input,amountCents:amount(input.start,input.end,config.hourlyRateCents)};await tx.save(changed);return changed;});}
}
