import sql from 'mssql';
import { ReservationStore,UnitOfWork } from '../application/ports';
import { Capacity,IntegrationEvent,Reservation } from '../domain/reservation';
import { DomainError } from '../domain/errors';
type Executor=sql.ConnectionPool|sql.Transaction;
const request=(db:Executor,params:Record<string,unknown>={})=>{const r=db.request();for(const [key,value]of Object.entries(params))r.input(key,value);return r;};
const decode=(r:any):Reservation=>({...r,id:r.id.toLowerCase(),userId:r.userId.toLowerCase(),parkingId:r.parkingId.toLowerCase(),vehicleId:r.vehicleId.toLowerCase(),start:new Date(r.start).toISOString(),end:new Date(r.end).toISOString(),createdAt:new Date(r.createdAt).toISOString()});
const decodeCapacity=(r:any):Capacity=>({...r,parkingId:r.parkingId.toLowerCase()});
export class SqlStore implements ReservationStore{
 constructor(private pool:sql.ConnectionPool){}
 static async connect(){const pool=await new sql.ConnectionPool({server:process.env.SQL_SERVER!,port:Number(process.env.SQL_PORT||1433),database:process.env.SQL_DATABASE||'smartpark',user:process.env.SQL_USER,password:process.env.SQL_PASSWORD,options:{encrypt:process.env.SQL_ENCRYPT!=='false',trustServerCertificate:process.env.SQL_TRUST_CERT==='true'},pool:{max:5,min:0,idleTimeoutMillis:30000},connectionTimeout:30000,requestTimeout:20000}).connect();return new SqlStore(pool);}
 async migrate(){await this.pool.request().query(`
 IF OBJECT_ID('dbo.Capacities') IS NULL CREATE TABLE dbo.Capacities(parkingId uniqueidentifier PRIMARY KEY, capacity int NOT NULL CHECK(capacity>0), hourlyRateCents int NOT NULL CHECK(hourlyRateCents>=0));
 IF OBJECT_ID('dbo.Reservations') IS NULL BEGIN
 CREATE TABLE dbo.Reservations(id uniqueidentifier PRIMARY KEY,userId uniqueidentifier NOT NULL,parkingId uniqueidentifier NOT NULL REFERENCES dbo.Capacities(parkingId),vehicleId uniqueidentifier NOT NULL,[start] datetime2 NOT NULL,[end] datetime2 NOT NULL,status varchar(16) NOT NULL CHECK(status IN ('reserved','paid','cancelled')),amountCents int NOT NULL,createdAt datetime2 NOT NULL,CHECK([end]>[start]));
 CREATE INDEX IX_Reservations_ParkingPeriod ON dbo.Reservations(parkingId,[start],[end]); CREATE INDEX IX_Reservations_User ON dbo.Reservations(userId,createdAt);
 END;
 IF OBJECT_ID('dbo.Outbox') IS NULL CREATE TABLE dbo.Outbox(eventId uniqueidentifier PRIMARY KEY,payload nvarchar(max) NOT NULL,createdAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),sentAt datetime2 NULL);
 `);}
 async transact<T>(parkingId:string,work:(tx:UnitOfWork)=>Promise<T>):Promise<T>{const tx=new sql.Transaction(this.pool);await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);try{const lock=await request(tx,{resource:'parking:'+parkingId}).query(`DECLARE @result int; EXEC @result=sp_getapplock @Resource=@resource,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; SELECT @result result;`);if(lock.recordset[0].result<0)throw new DomainError(409,'Estacionamento ocupado. Tente novamente.');const result=await work(new SqlUnit(tx,parkingId));await tx.commit();return result;}catch(e){try{await tx.rollback();}catch{}throw e;}}
 async list(userId?:string){const result=await request(this.pool,{userId:userId||null}).query('SELECT * FROM dbo.Reservations WHERE (@userId IS NULL OR userId=@userId) ORDER BY createdAt DESC');return result.recordset.map(decode);}
 async get(id:string){const result=await request(this.pool,{id}).query('SELECT * FROM dbo.Reservations WHERE id=@id');return result.recordset[0]?decode(result.recordset[0]):null;}
 async capacities(){return (await this.pool.request().query('SELECT * FROM dbo.Capacities')).recordset.map(decodeCapacity);}
 async pendingEvents(){return (await this.pool.request().query('SELECT TOP (50) payload FROM dbo.Outbox WHERE sentAt IS NULL ORDER BY createdAt')).recordset.map(r=>JSON.parse(r.payload) as IntegrationEvent);}
 async markSent(eventId:string){await request(this.pool,{eventId}).query('UPDATE dbo.Outbox SET sentAt=SYSUTCDATETIME() WHERE eventId=@eventId AND sentAt IS NULL');}
}
class SqlUnit implements UnitOfWork{
 constructor(private tx:sql.Transaction,private parkingId:string){}
 async capacity(){const row=(await request(this.tx,{id:this.parkingId}).query('SELECT * FROM dbo.Capacities WHERE parkingId=@id')).recordset[0];return row?decodeCapacity(row):null;}
 async setCapacity(value:Capacity){await request(this.tx,value).query('UPDATE dbo.Capacities SET capacity=@capacity,hourlyRateCents=@hourlyRateCents WHERE parkingId=@parkingId; IF @@ROWCOUNT=0 INSERT dbo.Capacities VALUES(@parkingId,@capacity,@hourlyRateCents);');}
 async reservations(){return (await request(this.tx,{id:this.parkingId}).query('SELECT * FROM dbo.Reservations WHERE parkingId=@id')).recordset.map(decode);}
 async save(v:Reservation){await request(this.tx,{...v,start:new Date(v.start),end:new Date(v.end),createdAt:new Date(v.createdAt)}).query(`UPDATE dbo.Reservations SET [start]=@start,[end]=@end,status=@status,amountCents=@amountCents WHERE id=@id;
 IF @@ROWCOUNT=0 INSERT dbo.Reservations(id,userId,parkingId,vehicleId,[start],[end],status,amountCents,createdAt) VALUES(@id,@userId,@parkingId,@vehicleId,@start,@end,@status,@amountCents,@createdAt);`);}
 async emit(e:IntegrationEvent){await request(this.tx,{eventId:e.eventId,payload:JSON.stringify(e)}).query('INSERT dbo.Outbox(eventId,payload) VALUES(@eventId,@payload)');}
}
