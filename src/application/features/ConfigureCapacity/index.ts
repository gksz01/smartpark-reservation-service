import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
export class ConfigureCapacity{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,value:Capacity,token:string){requireAdmin(actor);await this.catalog.verify(value.parkingId,undefined,token);return this.store.transact(value.parkingId,async tx=>{const rows=await tx.reservations();if(peak(rows.filter(r=>Date.parse(r.end)>Date.now()))>value.capacity)throw new DomainError(409,'Capacidade inferior às reservas existentes.');await tx.setCapacity(value);return value;});}
}
