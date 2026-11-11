import { Capacity, IntegrationEvent, Reservation } from '../domain/reservation';
export interface UnitOfWork{
 capacity():Promise<Capacity|null>; setCapacity(value:Capacity):Promise<void>; reservations():Promise<Reservation[]>;
 save(value:Reservation):Promise<void>; emit(event:IntegrationEvent):Promise<void>;
}
export interface ReservationStore{
 transact<T>(parkingId:string,work:(tx:UnitOfWork)=>Promise<T>):Promise<T>;
 list(userId?:string):Promise<Reservation[]>; get(id:string):Promise<Reservation|null>;
 capacities():Promise<Capacity[]>; pendingEvents():Promise<IntegrationEvent[]>; markSent(eventId:string):Promise<void>;
}
export interface CatalogClient{verify(parkingId:string,vehicleId:string|undefined,token:string):Promise<void>;}
export interface Publisher{send(event:IntegrationEvent):Promise<void>;}
