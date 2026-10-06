const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const modules = new Map();
function load(relative) {
  const file = path.resolve(__dirname, '..', relative);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', source)(
    spec => spec.startsWith('.') ? load(path.resolve(path.dirname(file), spec + '.ts')) : require(spec),
    module, module.exports,
  );
  return module.exports;
}
const { monetaryLoss } = load('src/utils/calculations.ts');
const { money } = load('src/utils/formatters.ts');
const { eventRows, csv } = load('src/services/eventService.ts');
test('converts seconds to minutes without rounding away short events', () => {
  assert.equal(monetaryLoss(300, 100), 500);
  assert.equal(monetaryLoss(15, 100), 25);
  assert.ok(Math.abs(monetaryLoss(7, 100) - 11.6666666667) < 1e-8);
  assert.equal(money(monetaryLoss(7, 100)), '₹11.67');
});
test('distinguishes unavailable cost/data from deliberately configured zero', () => {
  assert.equal(monetaryLoss(300, null), null);
  assert.equal(monetaryLoss(null, 100), null);
  assert.equal(monetaryLoss(undefined, 100), null);
  assert.equal(monetaryLoss(0, 100), 0);
  assert.equal(monetaryLoss(300, 0), 0);
  assert.equal(money(null), '—');
});
test('rejects negative, non-finite and overflowing inputs', () => {
  for (const rate of [-10, NaN, Infinity]) assert.equal(monetaryLoss(60, rate), null);
  assert.equal(monetaryLoss(-1, 100), null);
  assert.equal(monetaryLoss(Infinity, 100), null);
  assert.equal(monetaryLoss(Number.MAX_VALUE, Number.MAX_VALUE), null);
});
test('event exports retain source and rate and leave unknown amounts empty', () => {
  const event = {id:'SIM-001',machineId:'CNC-001',startTime:100000,endTime:115000,duration:15,transport:'SIMULATION'};
  const row=eventRows([event],100)[0];
  assert.equal(row.estimated_loss_INR,25);
  assert.equal(row.assumed_cost_INR_per_minute,100);
  assert.equal(row.source,'SIMULATION');
  const unknown=eventRows([event])[0];
  assert.equal(unknown.estimated_loss_INR,null);
  assert.equal(unknown.assumed_cost_INR_per_minute,null);
  const parsed=csv([unknown]).split('\r\n')[1];
  assert.ok(parsed.includes('"15","","","recorded_micro_stoppage_duration"'));
});

const {demoLossBuckets,recordedLossBucket,productionLoss}=load('src/utils/productionLoss.ts');
test('sample shift reconciles time, units, money and capacity at editable assumptions',()=>{
  const result=productionLoss(demoLossBuckets,30,100);
  assert.equal(result.events,35);
  assert.equal(result.stopSeconds,1140);
  assert.equal(result.lostUnits,38);
  assert.equal(result.amount,1900);
  assert.equal(result.idealUnits,960);
  assert.equal(result.remainingUnits,922);
  assert.ok(Math.abs(result.lossPercent-3.9583333333333335)<1e-10);
  const adjusted=productionLoss(demoLossBuckets,60,200);
  assert.equal(adjusted.lostUnits,19);
  assert.equal(adjusted.amount,3800);
  assert.equal(adjusted.remainingUnits,461);
});
test('boundary-crossing events split duration without duplicating event counts',()=>{
  const event={startTime:55000,endTime:65000,duration:10};
  const history=Array.from({length:13},(_,i)=>({timestamp:i*10000,machineStatus:'RUNNING'}));
  const first=recordedLossBucket('first',history,[event],0,60000,15);
  const second=recordedLossBucket('second',history,[event],60000,120000,15);
  assert.equal(first.stopSeconds,5);assert.equal(second.stopSeconds,5);
  assert.equal(first.events+second.events,1);
  const result=productionLoss([first,second],30,100);
  assert.equal(result.stopSeconds,10);
  assert.equal(result.idealUnits,4);
  assert.ok(Math.abs(result.lossPercent-100/12)<1e-10);
});
test('missing telemetry does not become a capacity percentage or measured zero loss',()=>{
  const empty=recordedLossBucket('empty',[],[],0,60000,15);
  const result=productionLoss([empty],30,100);
  assert.equal(result.hasData,false);assert.equal(result.lostUnits,null);
  assert.equal(result.lossPercent,null);assert.equal(result.amount,null);
  const history=[{timestamp:0,machineStatus:'RUNNING'},{timestamp:10000,machineStatus:'RUNNING'},{timestamp:50000,machineStatus:'RUNNING'},{timestamp:60000,machineStatus:'RUNNING'}];
  const event={startTime:20000,endTime:25000,duration:5};
  const gap=productionLoss([recordedLossBucket('gap',history,[event],0,60000,15)],30,100);
  assert.equal(gap.lossPercent,null);assert.equal(gap.idealUnits,null);
  assert.equal(gap.lostUnits,5/30);
});
