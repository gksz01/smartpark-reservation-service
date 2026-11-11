import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
export class ListReservations{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 execute(actor:Actor){return this.store.list(actor.role==='admin'?undefined:actor.sub);}
}
