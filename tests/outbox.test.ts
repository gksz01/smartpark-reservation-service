import {it,expect,vi} from 'vitest';
import {DispatchOutbox} from '../src/application/features/dispatch-outbox';
it('mantém evento pendente quando a publicação falha',async()=>{const markSent=vi.fn();const store={pendingEvents:async()=>[{eventId:'1'}],markSent} as any;await expect(new DispatchOutbox(store,{send:async()=>{throw new Error('queue offline');}}).execute()).rejects.toThrow();expect(markSent).not.toHaveBeenCalled();});
it('marca enviado somente após publicação',async()=>{const calls:string[]=[];const store={pendingEvents:async()=>[{eventId:'1'}],markSent:async()=>{calls.push('mark');}} as any;await new DispatchOutbox(store,{send:async()=>{calls.push('send');}}).execute();expect(calls).toEqual(['send','mark']);});
