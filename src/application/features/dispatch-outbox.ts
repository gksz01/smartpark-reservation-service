import { Publisher, ReservationStore } from '../ports';
export class DispatchOutbox{
 constructor(private store:ReservationStore,private publisher:Publisher){}
 async execute(){let sent=0;for(const event of await this.store.pendingEvents()){await this.publisher.send(event);await this.store.markSent(event.eventId);sent++;}return {sent};}
}
