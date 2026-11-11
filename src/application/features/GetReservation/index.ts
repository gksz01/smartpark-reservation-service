import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
export class GetReservation{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(actor:Actor,id:string){const r=await this.store.get(id);if(!r)throw new DomainError(404,'Reserva não encontrada.');own(actor,r.userId);return r;}
}
