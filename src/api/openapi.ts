import {OpenAPIObject} from '@nestjs/swagger';
const ref=(name:string)=>({'$ref':'#/components/schemas/'+name});
const str={type:'string'},uuid={type:'string',format:'uuid'},date={type:'string',format:'date-time'};
const object=(properties:Record<string,any>,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
export function completeContract(doc:OpenAPIObject,service:'catalog'|'booking'|'bff'){
 const schemas:Record<string,any>={
 Error:object({error:str,correlationId:str},['error']),
 Login:object({email:{type:'string',format:'email'},password:{type:'string',minLength:8,maxLength:72,writeOnly:true}}),
 Register:object({name:{type:'string',minLength:2},email:{type:'string',format:'email'},password:{type:'string',minLength:8,maxLength:72,writeOnly:true}}),
 User:object({id:uuid,name:str,email:str,role:{type:'string',enum:['driver','admin']}}),
 Session:object({token:str,user:ref('User')}),
 ParkingInput:object({name:{type:'string',minLength:2},address:{type:'string',minLength:5},description:str,active:{type:'boolean'}},['name','address']),
 Parking:object({id:uuid,name:str,address:str,description:str,active:{type:'boolean'}}),
 VehicleInput:object({plate:{type:'string',pattern:'^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'},model:str}),
 Vehicle:object({id:uuid,userId:uuid,plate:str,model:str}),
 Period:object({start:date,end:date}),
 CreateReservation:object({parkingId:uuid,vehicleId:uuid,start:date,end:date}),
 Reservation:object({id:uuid,userId:uuid,parkingId:uuid,vehicleId:uuid,start:date,end:date,status:{type:'string',enum:['reserved','paid','cancelled']},amountCents:{type:'integer',minimum:0},createdAt:date}),
 CapacityInput:object({capacity:{type:'integer',minimum:1,maximum:10000},hourlyRateCents:{type:'integer',minimum:0,maximum:1000000}}),
 Capacity:object({parkingId:uuid,capacity:{type:'integer'},hourlyRateCents:{type:'integer'}}),
 Availability:object({parkingId:uuid,capacity:{type:'integer'},hourlyRateCents:{type:'integer'},available:{type:'integer'},start:date,end:date}),
 PaymentInput:object({result:{type:'string',enum:['approved','declined']}}),
 Payment:object({reservation:ref('Reservation'),paymentStatus:{type:'string',enum:['approved','declined']},simulated:{type:'boolean',enum:[true]}}),
 Notification:object({id:uuid,userId:uuid,reservationId:uuid,message:str,createdAt:date,type:{type:'string',enum:['ReservaCriada','ReservaCancelada','PagamentoConfirmado']}}),
 Notifications:object({items:{type:'array',items:ref('Notification')},source:{type:'string',enum:['azure-functions']},generatedAt:date}),
 Aggregate:object({parkings:{type:'array',items:ref('Parking')},availability:{type:'array',items:ref('Availability')},reservations:{type:'array',items:ref('Reservation')},notifications:ref('Notifications'),correlationId:str,generatedAt:date}),
 Deleted:object({deleted:{type:'boolean'}})
 };
 doc.components={...doc.components,schemas:{...doc.components?.schemas,...schemas}};
 const paths:any={};
 function add(route:string,method:string,summary:string,response:string,input?:string,array=false,anonymous=false){
  const status=method==='post'&&!(service==='bff'&&route==='/auth/login')?'201':'200';
  const responses:any={[status]:{description:'Operação concluída',content:{'application/json':{schema:array?{type:'array',items:ref(response)}:ref(response)}}}};
  for(const [code,description] of Object.entries({'400':'Dados inválidos','401':'Autenticação ausente ou inválida','403':'Perfil sem permissão','404':'Recurso inexistente ou não pertence ao usuário','409':'Conflito de regra de negócio ou capacidade','503':'Dependência indisponível'}))responses[code]={description,content:{'application/json':{schema:ref('Error')}}};
  const operation:any={summary,tags:[route.split('/')[1]],operationId:method+route.replace(/[^a-zA-Z]/g,''),security:anonymous?[]:[{bearer:[]}],responses,parameters:[]};
  if(route.includes('{id}'))operation.parameters.push({name:'id',in:'path',required:true,schema:uuid});
  if(route==='/availability'||route==='/aggregated-data')for(const name of ['start','end'])operation.parameters.push({name,in:'query',required:true,schema:date,description:'UTC ISO 8601; fim posterior ao início, máximo de 30 dias.'});
  if(input)operation.requestBody={required:true,content:{'application/json':{schema:ref(input)}}};
  (paths[route]??={})[method]=operation;
 }
 if(service!=='booking'){
  add('/auth/register','post','Cadastrar motorista','Session','Register',false,true);add('/auth/login','post','Autenticar usuário','Session','Login',false,true);
  for(const [route,name,input] of [['parkings','Parking','ParkingInput'],['vehicles','Vehicle','VehicleInput']]){add('/'+route,'get','Listar '+route,name,undefined,true);add('/'+route,'post','Criar '+route,name,input);add('/'+route+'/{id}','get','Consultar '+route,name);add('/'+route+'/{id}','put','Atualizar '+route,name,input);add('/'+route+'/{id}','delete',route==='parkings'?'Desativar estacionamento (administrador)':'Excluir veículo do proprietário','Deleted');}
 }
 if(service!=='catalog'){
  add('/availability','get','Consultar capacidade por período','Availability',undefined,true);add('/capacities/{id}','put','Configurar capacidade e tarifa (administrador)','Capacity','CapacityInput');
  add('/reservations','get','Listar reservas permitidas para o usuário','Reservation',undefined,true);add('/reservations','post','Reservar capacidade com bloqueio transacional','Reservation','CreateReservation');add('/reservations/{id}','get','Consultar reserva','Reservation');add('/reservations/{id}','put','Alterar período de reserva não paga','Reservation','Period');add('/reservations/{id}','delete','Cancelar e liberar capacidade, preservando histórico','Reservation');add('/reservations/{id}/payment','post','Simular pagamento aprovado ou recusado; aprovação idempotente','Payment','PaymentInput');
 }
 if(service==='bff')add('/aggregated-data','get','Agregar Catálogo, Reservas e Azure Function em uma resposta','Aggregate');
 doc.paths=paths;
 doc.info.description='SmartPark: autentique-se no BFF, copie o token e use Authorize. Nos microserviços, Try it out usa o prefixo do gateway, que encaminha pelo BFF e acrescenta a credencial interna. Pagamento é simulado. DELETE de estacionamento e reserva preserva histórico. Contratos dos eventos: https://stsmartparkgkszz1126.z15.web.core.windows.net/contracts/events.html';
 return doc;
}
