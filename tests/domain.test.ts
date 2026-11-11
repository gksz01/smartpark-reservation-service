import {describe,it,expect} from 'vitest';
import {peak,period,amount,available,Reservation} from '../src/domain/reservation';
const row=(start:string,end:string,status='reserved')=>({start:'2030-01-01T'+start+':00Z',end:'2030-01-01T'+end+':00Z',status}) as Reservation;
describe('Reservas por capacidade',()=>{
 it('não soma reservas sequenciais como simultâneas',()=>expect(peak([row('10:00','11:00'),row('11:00','12:00')])).toBe(1));
 it('mede pico apenas dentro do intervalo consultado',()=>expect(peak([row('10:00','12:00'),row('11:00','13:00')],'2030-01-01T12:00:00Z','2030-01-01T13:00:00Z')).toBe(1));
 it('identifica sobreposição real',()=>expect(peak([row('10:00','12:00'),row('11:00','13:00')])).toBe(2));
 it('cancelamento libera capacidade',()=>expect(available({parkingId:'p',capacity:1,hourlyRateCents:1000},[row('10:00','12:00','cancelled')],'2030-01-01T10:00:00Z','2030-01-01T12:00:00Z')).toBe(1));
 it('rejeita fim anterior ao início',()=>expect(()=>period('2030-01-01T12:00:00Z','2030-01-01T10:00:00Z')).toThrow());
 it('rejeita datas inválidas e passado',()=>{expect(()=>period('a','b')).toThrow();expect(()=>period('2020-01-01T10:00:00Z','2020-01-01T12:00:00Z')).toThrow();});
 it('cobra por hora iniciada em centavos',()=>expect(amount('2030-01-01T10:00:00Z','2030-01-01T11:01:00Z',1250)).toBe(2500));
});
