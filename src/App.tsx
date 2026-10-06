'use client';
import {useState,useEffect,useRef,type CSSProperties} from 'react';
import {Activity,LayoutDashboard,Radio,ChartNoAxesCombined,Gauge,FileChartColumn,Cpu,Network,FlaskConical,Settings2,TrendingDown,ChevronRight,Bell,Download,CalendarDays,Wifi,ArrowUpRight,Square,Info} from 'lucide-react';
import {Sidebar,SidebarProvider,SidebarHeader,SidebarContent,SidebarFooter,SidebarGroup,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar} from '@/components/ui/sidebar';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Toaster} from '@/components/ui/sonner';
import {AppContext} from './context';
import {useTelemetry} from './services/telemetryService';
import {Badge,Choice} from './components/Common';
import {EventDetails,EventsPage} from './components/Events';
import {Overview,LiveMonitoring,Analytics,Performance} from './views/Monitoring';
import {Devices,Architecture,SettingsPage,Simulation} from './views/System';
import {Reports} from './views/Reports';
import {ProductionLoss} from './views/ProductionLoss';
import {time,fullDate,transportLabel} from './utils/formatters';
import type {StoppageEvent,MachineState} from './types';
const nav=[{id:'overview',label:'Overview',title:'Overview dashboard',subtitle:'Real-time machine monitoring. Every second accounted for.',icon:LayoutDashboard},{id:'production',label:'Production Loss',title:'Production loss monitoring',subtitle:'Track how micro-stoppages affect time, production capacity and cost.',icon:TrendingDown},{id:'live',label:'Live Monitor',title:'Live monitoring',subtitle:'Current, vibration and machine activity as they happen.',icon:Radio},{id:'events',label:'Micro-Stoppage Events',title:'Micro-stoppage events',subtitle:'Trace every interruption, from sensor drop to recovery.',icon:Activity},{id:'analytics',label:'Analytics',title:'Downtime analytics',subtitle:'Discover when small interruptions add up.',icon:ChartNoAxesCombined},{id:'performance',label:'Machine Performance',title:'Machine performance',subtitle:'A measured view of production time and hidden losses.',icon:Gauge},{id:'reports',label:'Reports',title:'Production reports',subtitle:'Turn recorded telemetry into clear, shareable summaries.',icon:FileChartColumn},{id:'devices',label:'Devices & Sensors',title:'Devices & sensors',subtitle:'Connection health across your monitoring system.',icon:Cpu},{id:'architecture',label:'System Architecture',title:'System architecture',subtitle:'The complete sensor-to-dashboard monitoring pipeline.',icon:Network},{id:'simulation',label:'Simulation',title:'Simulation workspace',subtitle:'Explore machine scenarios in a clearly separated demo session.',icon:FlaskConical},{id:'settings',label:'Settings',title:'System settings',subtitle:'Configure your machine, connection and dashboard preferences.',icon:Settings2}];
function Navigation({page,go,count}:{page:string;go:(page:string)=>void;count:number}){
  const {setOpenMobile,isMobile}=useSidebar();
  return (
    <SidebarContent className="nav-content">
      <nav aria-label="Main navigation">
        {[
          {caption:'WORKSPACE',items:nav.slice(0,7)},
          {caption:'SYSTEM',items:nav.slice(7)}
        ].map(g=>(
          <SidebarGroup className="nav-section" key={g.caption}>
            <p className="nav-caption">{g.caption}</p>
            <SidebarMenu>
              {g.items.map(n=>{
                const isActive=page===n.id;
                return (
                  <SidebarMenuItem key={n.id}>
                    <a
                      href={n.id==='overview'?'/':`/${n.id}`}
                      id={`nav-${n.id}`}
                      data-slot="sidebar-menu-button"
                      data-sidebar="menu-button"
                      data-active={isActive}
                      aria-current={isActive?'page':undefined}
                      className={`nav-link ${isActive?'active':''}`}
                      onClick={e=>{
                        e.preventDefault();
                        go(n.id);
                        if(isMobile) setOpenMobile(false);
                      }}
                    >
                      <n.icon className="nav-icon" />
                      <span className="nav-label">{n.label}</span>
                      {n.id==='events'&&count>0&&<b className="nav-count">{count}</b>}
                      {n.id==='simulation'&&<span className="nav-demo-badge">DEMO</span>}
                    </a>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </nav>
    </SidebarContent>
  );
}

export default function App({initialPage}:{initialPage?:string} = {}){
  const telemetry=useTelemetry();
  const {data,settings,startSimulation,stopSimulation,runScenario}=telemetry;
  const [page,setPage]=useState<string>(()=>{
    if(initialPage && nav.some(n=>n.id===initialPage)) return initialPage;
    if(typeof window!=='undefined'){
      const path=window.location.pathname.replace(/^\//,'').split('/')[0]||'';
      if(nav.some(n=>n.id===path)) return path;
      const raw=window.location.hash.replace(/^#/,'');
      if(nav.some(n=>n.id===raw)) return raw;
    }
    return 'overview';
  });
  const [now,setNow]=useState(0);
  const [selected,setSelected]=useState<StoppageEvent|null>(null);
  const [notifications,setNotifications]=useState(false);
  const [dismissed,setDismissed]=useState<string[]>([]);
  const online=data.source==='SIMULATION'||!!data.live&&data.databaseState==='connected'&&now-data.live.timestamp<=settings.staleAfter*1000&&data.live.machineStatus!=='OFFLINE';

  const go=(p:string)=>{
    if(!nav.some(n=>n.id===p))return;
    setPage(p);
    if(typeof window!=='undefined'){
      const targetUrl=p==='overview'?'/':`/${p}`;
      if(window.location.pathname!==targetUrl){
        window.history.pushState({page:p},'',targetUrl);
      }
      if(window.location.hash){
        window.location.hash='';
      }
      window.scrollTo({top:0,behavior:'instant'});
    }
  };

  useEffect(()=>{
    setNow(Date.now());
    const t=setInterval(()=>setNow(Date.now()),1000);
    const syncRoute=()=>{
      const path=window.location.pathname.replace(/^\//,'').split('/')[0]||'';
      const raw=window.location.hash.replace(/^#/,'');
      const target=(nav.some(n=>n.id===path)?path:'')||(nav.some(n=>n.id===raw)?raw:'overview');
      setPage(target);
    };
    syncRoute();
    window.addEventListener('popstate',syncRoute);
    window.addEventListener('hashchange',syncRoute);
    return()=>{
      clearInterval(t);
      window.removeEventListener('popstate',syncRoute);
      window.removeEventListener('hashchange',syncRoute);
    };
  },[]);

  useEffect(()=>{setSelected(null);setDismissed([])},[data.source]);
  useEffect(()=>{const listener=(e:Event)=>{const id=(e as CustomEvent).detail;const event=data.events.find(x=>x.id===id);if(event)setSelected(event)};window.addEventListener('cnc-view-event',listener);return()=>window.removeEventListener('cnc-view-event',listener)},[data.events]);
  useEffect(()=>{document.title=`${nav.find(n=>n.id===page)?.label} | CNC Monitor`},[page]);
  const apiRef=useRef({data,online,startSimulation,stopSimulation,runScenario});apiRef.current={data,online,startSimulation,stopSimulation,runScenario};
  useEffect(()=>{const context=(document as any).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();const afterPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const register=(tool:any)=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}};
  register({name:'read_cnc_status',title:'Read CNC monitoring status',description:'Read the visible machine state, current source, live readings and loaded event count.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input:unknown){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('Expected an empty object.');const s=apiRef.current;return {source:s.data.source,online:s.online,machine:s.data.live?.machineId||settings.machineId,state:s.online?s.data.live?.machineStatus:'OFFLINE',current:s.online?s.data.live?.current:null,vibration:s.online?s.data.live?.vibration:null,loadedEvents:s.data.events.length}}});
  register({name:'set_cnc_simulation',title:'Set CNC simulation mode',description:'Explicitly start or stop educational demo mode. Starting loads generated demo history. Stopping clears demo data. Live hardware always has priority.',inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input:any){if(!input||typeof input.enabled!=='boolean'||Object.keys(input).some(k=>k!=='enabled'))throw new Error('enabled must be a boolean.');if(input.enabled){if(apiRef.current.data.source!=='SIMULATION'&&!apiRef.current.startSimulation())throw new Error('Live hardware has priority.');}else if(apiRef.current.data.source==='SIMULATION')apiRef.current.stopSimulation();await afterPaint();return {source:apiRef.current.data.source};}});
  register({name:'run_cnc_scenario',title:'Run CNC demo scenario',description:'Change the active demo to RUNNING, IDLE, STOPPED or a timed MICRO-STOPPAGE. Requires simulation mode.',inputSchema:{type:'object',properties:{state:{type:'string',enum:['RUNNING','IDLE','STOPPED','MICRO-STOPPAGE']}},required:['state'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input:any){if(!input||!['RUNNING','IDLE','STOPPED','MICRO-STOPPAGE'].includes(input.state)||Object.keys(input).some(k=>k!=='state'))throw new Error('Invalid machine scenario.');if(!apiRef.current.runScenario(input.state))throw new Error('Enable simulation and wait for any active micro-stoppage to finish.');await afterPaint();return {source:apiRef.current.data.source,scenario:apiRef.current.data.scenario};}});
  return()=>lifecycle.abort();},[]);
  const active=nav.find(n=>n.id===page)||nav[0];const today=now?new Date(now).setHours(0,0,0,0):0;const count=data.events.filter(e=>e.startTime>=today).length;const pages:Record<string,any>={overview:Overview,production:ProductionLoss,live:LiveMonitoring,events:EventsPage,analytics:Analytics,performance:Performance,reports:Reports,devices:Devices,architecture:Architecture,simulation:Simulation,settings:SettingsPage};const Page=pages[page]||Overview;const alerts=data.events.filter(e=>!dismissed.includes(e.id)).slice(0,10);
  return <AppContext.Provider value={{...telemetry,now,online,go,openEvent:setSelected}}><div className={`${settings.reduceMotion?'low-motion':''} ${settings.theme==='contrast'?'high-contrast':''}`}><SidebarProvider style={{'--sidebar-width':'256px'} as CSSProperties}><Sidebar className="app-sidebar"><SidebarHeader className="p-0"><a href="/" className="brand" onClick={e=>{e.preventDefault();go('overview')}} aria-label="CNC Monitor overview"><span className="brand-symbol"><Cpu size={24}/></span><span><strong>CNC<span style={{color:'#a5afbc',fontWeight:400}}> MONITOR</span></strong><small>MICRO-STOPPAGE MONITORING</small></span></a></SidebarHeader><Navigation page={page} go={go} count={count}/><SidebarFooter className="side-bottom"><div className="side-device" role="button" tabIndex={0} onClick={()=>go('devices')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')go('devices')}} style={{cursor:'pointer'}} title="View Devices & Sensors"><span className="device-square"><Cpu size={18}/></span><div><strong style={{color:'#d7dfe8',fontWeight:500}}>{settings.machineId}</strong><div style={{fontSize:11,marginTop:3,color:'#8e99a9'}}><span className={`status-dot ${online?'online':''}`}/>{data.source==='SIMULATION'?'SIMULATION':online?'ONLINE':'OFFLINE'}<span style={{margin:'0 6px'}}>·</span>{data.source==='SIMULATION'?'Demo':transportLabel(data.live?.transport)}</div></div></div><p>Industrial IoT <span style={{float:'right',color:'#616c7b'}}>v1.0</span></p></SidebarFooter></Sidebar><SidebarInset style={{minWidth:0}}><header className="topbar"><SidebarTrigger className="md:hidden"/><div className="top-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();go('overview')}} style={{cursor:'pointer',color:'inherit',textDecoration:'none'}} title="Back to Overview">Workspace</a><ChevronRight size={13}/><strong>{active.label}</strong></div><div className="top-actions"><div style={{minWidth:118}}><Choice label="Selected machine" value={settings.machineId} onChange={()=>{}} options={[{value:settings.machineId,label:settings.machineId}]}/></div><span className={`badge ${online?'running':'offline'}`}><span className={`status-dot ${online?'online':''}`}/>{data.source==='SIMULATION'?'DEMO':online?'LIVE':'OFFLINE'}</span><span className="top-clock mono">{now?fullDate(now):'—'} <span style={{marginLeft:7,color:'#bec8d4'}}>{time(now)}</span></span><button className="icon-btn" aria-label="Open notifications" onClick={()=>setNotifications(true)} style={{position:'relative'}}><Bell size={18}/>{alerts.length>0&&<i style={{position:'absolute',width:5,height:5,background:'#efb547',borderRadius:'50%',top:5,right:7}}/>}</button></div></header><main className="workspace"><div className="page-head"><div><div className="eyebrow" style={{marginBottom:6}}>CNC MICRO-STOPPAGE MONITORING</div><h1>{active.title}</h1><p>{active.subtitle}</p></div><div className="head-actions">{page==='overview'&&<><button className="btn optional" onClick={()=>go('analytics')}><CalendarDays/>Today</button><button className="btn" onClick={()=>go('reports')}><Download/>Export report</button></>}{page==='live'&&<span className="badge">{data.source==='SIMULATION'?'SIMULATION':'LIVE HARDWARE'}</span>}</div></div>{page!=='production'&&<div className={`source-strip ${data.source==='SIMULATION'?'demo':''}`} role="status"><div className="strip-left"><span className={`badge ${data.source==='HARDWARE'?'offline':''}`}>{data.source==='SIMULATION'?<FlaskConical size={12}/>:<Wifi size={12}/>} {data.source==='SIMULATION'?'SIMULATION':'LIVE HARDWARE'}</span><span>{data.source==='SIMULATION'?'Generated demo data · no physical machine connected':online?'ESP32 connected · receiving machine telemetry':'ESP32 offline · awaiting telemetry'}</span></div>{data.source==='SIMULATION'?<button className="btn-text" onClick={stopSimulation} style={{fontSize:12,whiteSpace:'nowrap'}}><Square size={12}/>Stop demo</button>:<span className="strip-sync">Last reading <span className="mono">{time(data.live?.timestamp)}</span></span>}</div>}{data.historyError&&<p className="note warn">{data.historyError}</p>}{data.error&&page!=='devices'&&page!=='settings'&&<p className="note warn">{data.error} <button className="btn-text" onClick={()=>go('settings')}>Connection settings</button></p>}<Page/>{page!=='production'&&<footer className="footer" style={{marginTop:24}}><span><Cpu size={12}/>ESP32 + MPU6050 + ACS712 <span style={{margin:'0 3px'}}> / </span>{data.source==='SIMULATION'?'Simulated telemetry':transportLabel(data.live?.transport)+' telemetry'}</span><span>{data.source==='SIMULATION'?'EDUCATIONAL DEMONSTRATION':'HARDWARE MONITORING'}<span style={{margin:'0 3px'}}>·</span>{data.source==='SIMULATION'?'Not connected to a physical CNC machine':'All times shown in browser local time'}</span></footer>}</main></SidebarInset></SidebarProvider><EventDetails event={selected?data.events.find(e=>e.id===selected.id)||selected:null} close={()=>setSelected(null)}/><Sheet open={notifications} onOpenChange={setNotifications}><SheetContent className="sheet-content" style={{maxWidth:450}}><SheetHeader><SheetTitle>Notifications</SheetTitle><SheetDescription>{data.source==='SIMULATION'?'Simulation events':'Hardware events'} · recent interruptions</SheetDescription></SheetHeader>{alerts.length?alerts.map(e=><div key={e.id} className="alert-item"><strong className="amber">MICRO-STOPPAGE DETECTED</strong><p>{e.machineId} · {Math.round(e.duration)} seconds</p><small>{time(e.startTime)} · {e.transport==='SIMULATION'?'Simulated event':'Hardware event'}</small><div className="head-actions" style={{marginTop:13}}><button className="btn-text" onClick={()=>{setSelected(e);setNotifications(false)}}>View event <ArrowUpRight size={13}/></button><button className="btn-text muted" style={{marginLeft:'auto'}} onClick={()=>setDismissed(d=>[...d,e.id])}>Dismiss</button></div></div>):<p className="note">No new event notifications.</p>}</SheetContent></Sheet><Toaster theme="dark" position="bottom-right" closeButton richColors/></div></AppContext.Provider>}
