import { randomUUID } from 'node:crypto';
import { Actor,DomainError,own,requireAdmin } from '../../domain/errors';
import { available,amount,Capacity,IntegrationEvent,peak,period,Reservation } from '../../domain/reservation';
import { CatalogClient,ReservationStore,UnitOfWork } from '../ports';
import {ListReservations} from './ListReservations';
import {GetReservation} from './GetReservation';
import {ConfigureCapacity} from './ConfigureCapacity';
import {GetAvailability} from './GetAvailability';
import {CreateReservation} from './CreateReservation';
import {UpdateReservation} from './UpdateReservation';
import {CancelReservation} from './CancelReservation';
import {PayReservation} from './PayReservation';

/** Composition facade; business logic lives in individual feature slices. */
export class Reservations{
 constructor(private store:ReservationStore,private catalog:CatalogClient){}
 list(actor:Actor){return new ListReservations(this.store,this.catalog).execute(actor);}
 get(actor:Actor,id:string){return new GetReservation(this.store,this.catalog).execute(actor,id);}
 capacity(actor:Actor,value:Capacity,token:string){return new ConfigureCapacity(this.store,this.catalog).execute(actor,value,token);}
 availability(start:string,end:string){return new GetAvailability(this.store,this.catalog).execute(start,end);}
 create(actor:Actor,input:{parkingId:string;vehicleId:string;start:string;end:string},token:string,correlationId:string){return new CreateReservation(this.store,this.catalog).execute(actor,input,token,correlationId);}
 update(actor:Actor,id:string,input:{start:string;end:string},correlationId:string){return new UpdateReservation(this.store,this.catalog).execute(actor,id,input,correlationId);}
 cancel(actor:Actor,id:string,correlationId:string){return new CancelReservation(this.store,this.catalog).execute(actor,id,correlationId);}
 pay(actor:Actor,id:string,result:'approved'|'declined',correlationId:string){return new PayReservation(this.store,this.catalog).execute(actor,id,result,correlationId);}
}
