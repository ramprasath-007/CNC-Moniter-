import type {StoppageEvent,Telemetry} from '../types';
import {monetaryLoss,metrics} from './calculations';

export interface LossBucket {label:string;observedSeconds:number|null;stopSeconds:number;events:number;coverageComplete:boolean}
// Deliberately synthetic: one eight-hour shift with 35 completed interruptions.
export const demoStopDurations = [
  [12,18,24,36], [15,20,30,40,45], [20,25,30,35,45,55], [15,25,35,45],
  [20,25,35,45,55], [25,35], [30,35,40,45,45,45], [20,30,40],
];
export const demoLossBuckets:LossBucket[] = demoStopDurations.map((durations,i)=>({
  label:`${String(i+8).padStart(2,'0')}:00`, observedSeconds:3600,coverageComplete:true,
  stopSeconds:durations.reduce((sum,d)=>sum+d,0), events:durations.length,
}));

export function recordedLossBucket(label:string,history:Telemetry[],events:StoppageEvent[],start:number,end:number,maxGap:number):LossBucket {
  const m=metrics(history,[],start,end,maxGap);
  // Count each event once; allocate its duration across boundary-crossing buckets.
  const stopSeconds=events.reduce((sum,event)=>sum+Math.max(0,Math.min(event.endTime,end)-Math.max(event.startTime,start))/1000,0);
  const coverageComplete=events.every(event=>{
    const from=Math.max(event.startTime,start),to=Math.min(event.endTime,end);
    if(to<=from)return true;
    let covered=0;
    for(let i=0;i<history.length-1;i++){
      const a=history[i],b=history[i+1],gap=(b.timestamp-a.timestamp)/1000;
      if(gap<=0||gap>maxGap||a.machineStatus==='OFFLINE')continue;
      covered+=Math.max(0,Math.min(b.timestamp,to)-Math.max(a.timestamp,from));
    }
    return covered>=to-from-1;
  });
  return {label,observedSeconds:m.available>0?m.available:null,stopSeconds,coverageComplete,
    events:events.filter(e=>e.startTime>=start&&e.startTime<end).length};
}

export function productionLoss(buckets:LossBucket[],cycleSeconds:number|null,rate:number|null){
  const stopSeconds=buckets.reduce((sum,b)=>sum+b.stopSeconds,0);
  const events=buckets.reduce((sum,b)=>sum+b.events,0);
  const observedSeconds=buckets.reduce((sum,b)=>sum+(b.observedSeconds??0),0);
  const hasData=observedSeconds>0||events>0||stopSeconds>0;
  // Do not compare event totals with incomplete telemetry coverage.
  const comparable=observedSeconds>0&&buckets.every(b=>b.stopSeconds===0||(b.coverageComplete&&b.observedSeconds!=null&&b.observedSeconds>=b.stopSeconds));
  const cycle=cycleSeconds!=null&&Number.isFinite(cycleSeconds)&&cycleSeconds>0?cycleSeconds:null;
  const lostUnits=hasData&&cycle!=null?stopSeconds/cycle:null;
  const idealUnits=comparable&&cycle!=null?observedSeconds/cycle:null;
  return {stopSeconds,events,observedSeconds,hasData,lostUnits,idealUnits,
    remainingUnits:idealUnits!=null&&lostUnits!=null?idealUnits-lostUnits:null,
    lossPercent:comparable?stopSeconds/observedSeconds*100:null,
    amount:monetaryLoss(hasData?stopSeconds:null,rate)};
}
