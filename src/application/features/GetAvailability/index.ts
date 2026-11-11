import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../../ports';
export class GetAvailability{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 async execute(start:string,end:string){period(start,end);const configs=await this.store.capacities();const rows=await this.store.list();return configs.map(c=>({...c,available:available(c,rows.filter(r=>r.parkingId===c.parkingId),start,end),start,end}));}
}
