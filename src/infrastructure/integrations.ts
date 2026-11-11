import { QueueClient } from '@azure/storage-queue';
import { CatalogClient,Publisher } from '../application/ports';
import { DomainError } from '../domain/errors';
import { IntegrationEvent } from '../domain/reservation';
export class HttpCatalog implements CatalogClient{
 async verify(parkingId:string,vehicleId:string|undefined,token:string){for(const route of ['/parkings/'+parkingId,...(vehicleId?['/vehicles/'+vehicleId]:[])]){let response:Response;try{response=await fetch(process.env.CATALOG_URL+route,{headers:{authorization:'Bearer '+token,'x-service-key':process.env.INTERNAL_API_KEY!},signal:AbortSignal.timeout(20000)});}catch{throw new DomainError(503,'Catálogo temporariamente indisponível.');}if(!response.ok)throw new DomainError(response.status===404?404:503,'Não foi possível validar estacionamento ou veículo.');const data=await response.json() as any;if(route.startsWith('/parkings/')&&!data.active)throw new DomainError(409,'Estacionamento inativo.');}}
}
export class StoragePublisher implements Publisher{
 private queue=new QueueClient(process.env.AZURE_STORAGE_CONNECTION_STRING!,process.env.EVENT_QUEUE||'smartpark-events');
 async send(event:IntegrationEvent){await this.queue.createIfNotExists();await this.queue.sendMessage(Buffer.from(JSON.stringify(event)).toString('base64'));}
}
