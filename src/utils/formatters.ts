export const time = (n:number|null|undefined,seconds=true) => n ? new Date(n).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',...(seconds?{second:'2-digit'}:{})}) : '—';
export const dayKey = (n:number) => {const d=new Date(n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const duration = (s:number|null|undefined) => {if(s==null)return '—'; s=Math.max(0,Math.round(s));return s>=3600?`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`:s>=60?`${Math.floor(s/60)}m ${s%60}s`:`${s}s`};
export const num = (n:number|null|undefined,d=2) => n==null||!Number.isFinite(n)?'—':n.toFixed(d);
export const transportLabel=(s:string|undefined)=>s==='SIMULATION'?'Simulation':s==='LORA_GATEWAY'?'LoRa gateway':'Wi-Fi';
export const fullDate=(n:number)=>new Date(n).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
export const colors:Record<string,string>={'RUNNING':'#55b994','IDLE':'#628dad','MICRO-STOPPAGE':'#efb547','STOPPED':'#d5676d','OFFLINE':'#505c6c'};

export const money=(amount:number|null|undefined)=>amount==null||!Number.isFinite(amount)?'—':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
