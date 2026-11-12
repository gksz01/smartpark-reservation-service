import { Publisher, ReservationStore } from '../ports';
export class DispatchOutbox{
 constructor(private store:ReservationStore,private publisher:Publisher){}
 // Publish only after the transaction commits. Queue failure must not undo a successful command.
 async afterCommit<T>(operation:Promise<T>):Promise<T>{
  const result=await operation;
  try{await this.execute();}catch{console.warn('Outbox pending; recovery will retry');}
  return result;
 }
 async execute(){let sent=0;for(const event of await this.store.pendingEvents()){await this.publisher.send(event);await this.store.markSent(event.eventId);sent++;}return {sent};}
}
