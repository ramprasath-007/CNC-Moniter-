import type { Telemetry,StoppageEvent,MachineState } from '../types';
export function metrics(history:Telemetry[],events:StoppageEvent[],start:number,end:number,maxGap=15) {
 const samples=history.filter(s=>s.timestamp>=start&&s.timestamp<=end);const selectedEvents=events.filter(e=>e.startTime>=start&&e.startTime<=end);
 const durations:Record<MachineState,number>={RUNNING:0,IDLE:0,'MICRO-STOPPAGE':0,STOPPED:0,OFFLINE:0};
 for(let i=0;i<history.length-1;i++){const a=history[i],b=history[i+1];const delta=(b.timestamp-a.timestamp)/1000;if(delta<=0||delta>maxGap)continue;const seconds=Math.max(0,Math.min(b.timestamp,end)-Math.max(a.timestamp,start))/1000;if(a.machineStatus!=='OFFLINE')durations[a.machineStatus]+=seconds;}
 const available=Object.values(durations).reduce((a,b)=>a+b,0);const running=durations.RUNNING;const downtime=durations.STOPPED+durations['MICRO-STOPPAGE'];const micro=selectedEvents.reduce((sum,e)=>sum+e.duration,0);
 return {samples,events:selectedEvents,durations,available,running,downtime,micro,count:selectedEvents.length,utilization:available?running/available*100:null,downtimePct:available?downtime/available*100:null,frequency:available?selectedEvents.length/(available/3600):null,average:selectedEvents.length?micro/selectedEvents.length:null,longest:selectedEvents.length?Math.max(...selectedEvents.map(e=>e.duration)):null,avgCurrent:samples.length?samples.reduce((a,s)=>a+s.current,0)/samples.length:null,avgVibration:samples.length?samples.reduce((a,s)=>a+s.vibration,0)/samples.length:null,loss:available?durations['MICRO-STOPPAGE']/available*100:null};
}
export function timeline(history:Telemetry[],start:number,end:number,maxGap=15){const result:{state:MachineState;start:number;end:number}[]=[];for(let i=0;i<history.length-1;i++){const a=history[i],b=history[i+1];if(b.timestamp<start||a.timestamp>end)continue;const from=Math.max(a.timestamp,start),to=Math.min(b.timestamp,end);if(to<=from)continue;const state:MachineState=b.timestamp-a.timestamp>maxGap*1000?'OFFLINE':a.machineStatus;const prev=result[result.length-1];if(prev&&prev.state===state&&prev.end===from)prev.end=to;else result.push({state,start:from,end:to});}return result;}

/** Cost estimate for recorded micro-stoppage duration, never a forecast. */
export function monetaryLoss(seconds:number|null|undefined,ratePerMinute:number|null|undefined):number|null {
 if(seconds==null||ratePerMinute==null||!Number.isFinite(seconds)||!Number.isFinite(ratePerMinute)||seconds<0||ratePerMinute<0)return null;
 const amount=seconds/60*ratePerMinute;
 return Number.isFinite(amount)?amount:null;
}
