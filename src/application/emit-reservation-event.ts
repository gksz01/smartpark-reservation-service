import {randomUUID} from 'node:crypto';
import {UnitOfWork} from './ports';
import {Reservation,IntegrationEvent} from '../domain/reservation';
export function emitReservationEvent(tx:UnitOfWork,r:Reservation,type:IntegrationEvent['type'],correlationId:string){return tx.emit({eventId:randomUUID(),version:1,type,userId:r.userId,reservationId:r.id,occurredAt:new Date().toISOString(),correlationId});}
