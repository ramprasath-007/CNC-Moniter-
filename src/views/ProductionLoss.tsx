'use client';
import {useState} from 'react';
import {Activity,Download,FlaskConical,IndianRupee,Package,Settings2,Timer,TrendingDown} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {Panel,Kpi,Choice,NoData} from '../components/Common';
import {AnalyticsChart} from '../components/Charts';
import {useApp} from '../context';
import {downloadCsv} from '../services/eventService';
import {demoLossBuckets,productionLoss,recordedLossBucket} from '../utils/productionLoss';
import {monetaryLoss} from '../utils/calculations';
import {duration,money,num} from '../utils/formatters';

export function ProductionLossPreview(){
  const {go}=useApp();
  return <section className="loss-preview">
    <div><div className="eyebrow amber">PRODUCTION LOSS MONITORING</div><h2>Small stops. Measurable production impact.</h2><p>Explore lost time, estimated units and rupee loss in a complete sample shift.</p></div>
    <div className="loss-preview-stats"><span><strong>19 min</strong>downtime</span><span><strong>38 units</strong>estimated loss</span><span><strong>₹1,900</strong>estimated cost</span></div>
    <div className="loss-preview-action"><span className="badge">SYNTHETIC EXAMPLE</span><button className="btn btn-primary" onClick={()=>go('production')}>View production loss</button><small>30 s/unit · ₹100/min assumed</small></div>
  </section>;
}

export function ProductionLoss(){
  const {data,settings,now,go}=useApp();
  const [source,setSource]=useState('demo');
  const [period,setPeriod]=useState('1');
  const [demoCycle,setDemoCycle]=useState('30');
  const [demoRate,setDemoRate]=useState('100');
  const [machineCycle,setMachineCycle]=useState(String(settings.cycleTime));
  const [machineRate,setMachineRate]=useState(settings.downtimeCostPerMinute==null?'':String(settings.downtimeCostPerMinute));
  const demo=source==='demo';
  const cycleText=demo?demoCycle:machineCycle,rateText=demo?demoRate:machineRate;
  const cycle=cycleText.trim()===''?null:Number(cycleText),rate=rateText.trim()===''?null:Number(rateText);
  const validCycle=cycle!=null&&Number.isFinite(cycle)&&cycle>0;
  const validRate=rate==null||Number.isFinite(rate)&&rate>=0;
  const midnight=new Date(now);midnight.setHours(0,0,0,0);
  const buckets=demo?demoLossBuckets:Array.from({length:period==='1'?new Date(now).getHours()+1:7},(_,i)=>{
    const start=new Date(midnight);if(period==='1')start.setHours(i);else start.setDate(start.getDate()-6+i);
    const end=new Date(start);if(period==='1')end.setHours(end.getHours()+1);else end.setDate(end.getDate()+1);
    const label=period==='1'?`${String(i).padStart(2,'0')}:00`:start.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    return recordedLossBucket(label,data.history,data.events,start.getTime(),Math.min(now,end.getTime()),Math.max(settings.staleAfter,6));
  });
  const result=productionLoss(buckets,validCycle?cycle:null,validRate?rate:null);
  const sourceLabel=demo?'SYNTHETIC SAMPLE SHIFT':data.source==='SIMULATION'?'SIMULATED MACHINE RECORDS':'HARDWARE RECORDS';
  const unitValues=buckets.map(b=>validCycle?b.stopSeconds/cycle!:0);
  let accumulated=0;
  const moneyValues=buckets.map(b=>{accumulated+=b.stopSeconds;return monetaryLoss(accumulated,rate)??0});
  const worst=buckets.reduce((a,b)=>b.stopSeconds>a.stopSeconds?b:a,buckets[0]);
  function exportLoss(){
    downloadCsv(demo?'CNC-production-loss-demo.csv':'CNC-production-loss-records.csv',buckets.map(b=>({
      source:sourceLabel,machine:demo?'SYNTHETIC-CNC':settings.machineId,period:demo?'Example shift 08:00–16:00':period==='1'?'Today':'Last 7 days',
      generated_at:new Date(now||Date.now()).toISOString(),interval:b.label,completed_events:b.events,
      observed_seconds:b.observedSeconds,micro_stop_seconds:b.stopSeconds,
      estimated_units_lost:validCycle&&(b.observedSeconds!=null||b.events>0||b.stopSeconds>0)?b.stopSeconds/cycle!:null,
      estimated_loss_INR:monetaryLoss(b.observedSeconds!=null||b.events||b.stopSeconds?b.stopSeconds:null,validRate?rate:null),
      assumed_cycle_seconds:validCycle?cycle:null,assumed_cost_INR_per_minute:validRate?rate:null,
      basis:'Micro-stop duration only; cycle-equivalent estimate, not measured output or profit',
    })));
  }
  return <div className="production-loss">
    <div className="loss-toolbar">
      <label>Data source<Choice label="Production loss data source" value={source} onChange={setSource} options={[{value:'demo',label:'Demonstration dataset'},{value:'records',label:'Machine records'}]}/></label>
      {demo?<p>Sample shift <strong>08:00–16:00</strong></p>:<label>Period<Choice label="Production loss period" value={period} onChange={setPeriod} options={[{value:'1',label:'Today'},{value:'7',label:'Last 7 days'}]}/></label>}
      <button className="btn" disabled={!result.hasData||!validCycle||!validRate} onClick={exportLoss}><Download/>Export loss data</button>
    </div>
    <div className={`note ${demo||data.source==='SIMULATION'?'warn':''}`}>
      <strong>{demo?<FlaskConical/>:<Activity/>}{sourceLabel}</strong>
      <p>{demo?'35 synthetic micro-stoppages across an eight-hour shift. Example assumptions: 30 seconds per unit and ₹100 per minute. Change them below to explore the impact.':data.source==='SIMULATION'?'Uses the active simulator’s completed events and observed time. These are generated records, not physical machine measurements.':'Uses completed events and observed telemetry from the configured machine. Money and units are estimates based on your assumptions.'}</p>
    </div>
    <div className="kpi-grid">
      <Kpi label="Micro-stop time lost" value={result.hasData?duration(result.stopSeconds):'—'} context={`${result.events} completed interruptions`} icon={Timer} tone="amber"/>
      <Kpi label="Estimated units lost" value={num(result.lostUnits,1)} unit="units" context="Cycle-equivalent production capacity" icon={Package} tone="amber"/>
      <Kpi label="Estimated money loss" value={money(result.amount)} context={rate==null?'Enter a cost assumption below':`Assumed ${money(rate)} per minute`} icon={IndianRupee} tone="amber"/>
      <Kpi label="Micro-stop capacity loss" value={num(result.lossPercent,2)} unit="%" context="Lost time / observed time" icon={TrendingDown}/>
    </div>
    {!demo&&!result.hasData&&<NoData title="No machine records in this period" description="Use the demonstration dataset to explore production loss, or connect your machine in Settings."><button className="btn btn-primary" onClick={()=>setSource('demo')}>Show demonstration dataset</button><button className="btn" onClick={()=>go('settings')}>Connection settings</button></NoData>}
    <div className="grid-two">
      <Panel title="Production capacity impact" subtitle={demo?'One sample shift · 480 observed minutes':'Based on loaded observed time'} icon={Package}>
        <div className="panel-body">
          <div className="loss-capacity-values"><div><span>Ideal capacity</span><strong>{num(result.idealUnits,1)}</strong><small>cycle-equivalent units</small></div><div><span>After micro-stoppages</span><strong className="green">{num(result.remainingUnits,1)}</strong><small>cycle-equivalent units</small></div></div>
          <div className="loss-capacity-bar" role="img" aria-label={result.lossPercent==null?'Capacity comparison unavailable':`${num(result.lossPercent,2)} percent capacity lost to micro-stoppages`}>
            {result.lossPercent!=null&&<><span style={{width:`${100-result.lossPercent}%`}}/><span style={{width:`${result.lossPercent}%`}}/></>}
          </div>
          <div className="loss-bar-legend"><span><i/>Capacity after micro-stops</span><span><i/>{num(result.lostUnits,1)} units lost</span></div>
          <p className="loss-explainer">{demo?`${num(result.idealUnits,1)} ideal units − ${num(result.lostUnits,1)} estimated lost units = ${num(result.remainingUnits,1)} units of remaining capacity.`:'Capacity uses observed time; telemetry gaps are excluded. The comparison is unavailable when event duration cannot be matched to enough observed time.'}</p>
          <p className="loss-footnote">Capacity estimate only. Actual output, rejects, planned idle and other downtime are not measured by this comparison.</p>
        </div>
      </Panel>
      <Panel title="Production assumptions" icon={Settings2} subtitle="Adjust the inputs to recalculate this analysis">
        <div className="panel-body">
          <div className="field-grid">
            <label className="field">Ideal cycle time (seconds/unit)<input aria-label="Production cycle time" type="number" min="0.1" step="0.1" value={cycleText} onChange={e=>demo?setDemoCycle(e.target.value):setMachineCycle(e.target.value)}/></label>
            <label className="field">Downtime cost (₹/minute)<input aria-label="Production downtime cost" type="number" min="0" step="0.01" placeholder="Enter a cost assumption" value={rateText} onChange={e=>demo?setDemoRate(e.target.value):setMachineRate(e.target.value)}/></label>
          </div>
          {!validCycle&&<p role="alert" className="loss-validation">Enter a cycle time greater than zero.</p>}{!validRate&&<p role="alert" className="loss-validation">Cost must be zero or greater, or leave it blank.</p>}
          <div className="loss-formulas"><p><span>Units lost</span>Micro-stop seconds ÷ cycle time</p><p><span>Money loss</span>Micro-stop minutes × cost per minute</p></div>
          <button className="btn-text" onClick={()=>{if(demo){setDemoCycle('30');setDemoRate('100')}else{setMachineCycle(String(settings.cycleTime));setMachineRate(settings.downtimeCostPerMinute==null?'':String(settings.downtimeCostPerMinute))}}}>{demo?'Reset sample assumptions':'Use saved machine assumptions'}</button>
          <p className="loss-footnote">Changes apply to this view only. No future prediction or measured profit claim.</p>
        </div>
      </Panel>
    </div>
    {result.hasData&&<>
      <div className="grid-two">
        {validCycle?<AnalyticsChart title={demo||period==='1'?'Estimated units lost by hour':'Estimated units lost by day'} labels={buckets.map(b=>b.label)} values={unitValues} unit="Estimated units"/>:<Panel title="Estimated units lost"><NoData title="Cycle time needed" description="Enter a positive cycle time to calculate the unit-loss chart."/></Panel>}
        {validRate&&rate!=null?<AnalyticsChart title="Cumulative estimated money loss" labels={buckets.map(b=>b.label)} values={moneyValues} unit="INR · through end of interval" type="line" color="#db787c"/>:<Panel title="Cumulative estimated money loss"><NoData title="Cost assumption needed" description="Enter a downtime cost per minute to calculate monetary loss."/></Panel>}
      </div>
      <div className="loss-insight"><TrendingDown/><p><strong>Highest-loss interval: {worst.label}</strong> · {duration(worst.stopSeconds)} lost{validCycle?`, equivalent to ${num(worst.stopSeconds/cycle!,1)} units`:''}{validRate&&rate!=null?` and ${money(monetaryLoss(worst.stopSeconds,rate))}`:''}.</p></div>
      <Panel title="Production loss breakdown" subtitle="Every number traces back to interruption duration">
        <div className="table-wrap"><Table className="data-table"><TableHeader><TableRow>{['Interval','Events','Time lost','Estimated units lost','Estimated loss (₹)'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>
          {buckets.map(b=><TableRow key={b.label}><TableCell className="mono">{b.label}</TableCell><TableCell>{b.events}</TableCell><TableCell>{duration(b.stopSeconds)}</TableCell><TableCell>{validCycle&&(b.observedSeconds!=null||b.events>0||b.stopSeconds>0)?num(b.stopSeconds/cycle!,2):'—'}</TableCell><TableCell className="amber">{money(monetaryLoss(b.observedSeconds!=null||b.events||b.stopSeconds?b.stopSeconds:null,validRate?rate:null))}</TableCell></TableRow>)}
          <TableRow className="loss-total"><TableCell>Total</TableCell><TableCell>{result.events}</TableCell><TableCell>{duration(result.stopSeconds)}</TableCell><TableCell>{num(result.lostUnits,2)}</TableCell><TableCell>{money(result.amount)}</TableCell></TableRow>
        </TableBody></Table></div>
      </Panel>
    </>}
  </div>;
}
