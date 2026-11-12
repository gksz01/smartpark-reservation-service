import { Body,Controller,Delete,Get,Inject,Param,Post,Put,Query,Req } from '@nestjs/common';
import { ApiBearerAuth,ApiBody,ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Reservations } from '../application/features/reservations';
import { DispatchOutbox } from '../application/features/dispatch-outbox';
import { actor,bearer } from './common';
const range=z.object({start:z.string().datetime(),end:z.string().datetime()}).strict();
const id=(v:string)=>z.string().uuid().parse(v);
const rangeSchema={type:'object',required:['start','end'],properties:{start:{type:'string',format:'date-time'},end:{type:'string',format:'date-time'}}};
@ApiTags('Reservas e capacidade') @ApiBearerAuth() @Controller()
export class ReservationController{
 constructor(@Inject('RESERVATIONS')private service:Reservations,@Inject('OUTBOX')private outbox:DispatchOutbox){}
 @Get('health') health(){return {status:'ok',service:'reservations'};}
 @Get('availability') availability(@Query()query:unknown){const q=range.parse(query);return this.service.availability(q.start,q.end);}
 @Put('capacities/:id') @ApiBody({schema:{type:'object',properties:{capacity:{type:'integer',minimum:1},hourlyRateCents:{type:'integer',minimum:0}}}}) capacity(@Req()req:any,@Param('id')v:string,@Body()body:unknown){return this.service.capacity(actor(req),{parkingId:id(v),...z.object({capacity:z.number().int().min(1).max(10000),hourlyRateCents:z.number().int().min(0).max(1000000)}).strict().parse(body)},bearer(req));}
 @Get('reservations') list(@Req()req:any){return this.service.list(actor(req));}
 @Get('reservations/:id') get(@Req()req:any,@Param('id')v:string){return this.service.get(actor(req),id(v));}
 @Post('reservations') @ApiBody({schema:{...rangeSchema,properties:{...rangeSchema.properties,parkingId:{type:'string',format:'uuid'},vehicleId:{type:'string',format:'uuid'}}}}) create(@Req()req:any,@Body()body:unknown){return this.outbox.afterCommit(this.service.create(actor(req),range.extend({parkingId:z.string().uuid(),vehicleId:z.string().uuid()}).parse(body),bearer(req),req.correlationId));}
 @Put('reservations/:id') @ApiBody({schema:rangeSchema}) update(@Req()req:any,@Param('id')v:string,@Body()body:unknown){return this.service.update(actor(req),id(v),range.parse(body),req.correlationId);}
 @Delete('reservations/:id') cancel(@Req()req:any,@Param('id')v:string){return this.outbox.afterCommit(this.service.cancel(actor(req),id(v),req.correlationId));}
 @Post('reservations/:id/payment') @ApiBody({schema:{type:'object',properties:{result:{type:'string',enum:['approved','declined']}}}}) pay(@Req()req:any,@Param('id')v:string,@Body()body:unknown){return this.outbox.afterCommit(this.service.pay(actor(req),id(v),z.object({result:z.enum(['approved','declined'])}).strict().parse(body).result,req.correlationId));}
 @Post('internal/outbox/dispatch') dispatch(){return this.outbox.execute();}
}
