import {completeContract} from './openapi';
import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder,SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Reservations } from '../application/features/reservations';
import { DispatchOutbox } from '../application/features/dispatch-outbox';
import { SqlStore } from '../infrastructure/sql-store';
import { HttpCatalog,StoragePublisher } from '../infrastructure/integrations';
import { ReservationController } from './controller';
import { AccessGuard,Errors,correlation,env } from './common';
async function main(){for(const v of ['SQL_SERVER','SQL_USER','SQL_PASSWORD','JWT_SECRET','INTERNAL_API_KEY','CATALOG_URL','AZURE_STORAGE_CONNECTION_STRING'])env(v);const store=await SqlStore.connect();await store.migrate();
 @Module({controllers:[ReservationController],providers:[{provide:'RESERVATIONS',useValue:new Reservations(store,new HttpCatalog())},{provide:'OUTBOX',useValue:new DispatchOutbox(store,new StoragePublisher())}]})class App{}
 const app=await NestFactory.create(App);app.use(helmet());app.use(correlation);app.useGlobalGuards(new AccessGuard());app.useGlobalFilters(new Errors());SwaggerModule.setup('docs',app,completeContract(SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('SmartPark — Reservas').setVersion('1.0').addBearerAuth().addServer('/booking').build()),'booking'));await app.listen(Number(process.env.PORT||3002),'0.0.0.0');}
main().catch(e=>{console.error(e.name,e.message);process.exit(1);});
