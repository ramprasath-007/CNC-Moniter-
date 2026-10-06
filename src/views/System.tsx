'use client';

import { useEffect, useState } from 'react';

import {
    Cpu,
    Activity,
    Zap,
    Database,
    Wifi,
    ArrowRight,
    ArrowDown,
    Radio,
    LayoutDashboard,
    FileChartColumn,
    BarChart3,
    Play,
    Square,
    Pause,
    TriangleAlert,
    Save,
    Settings2,
    ShieldCheck,
    Network
} from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { Panel, Choice, Badge } from '../components/Common';
import { useApp } from '../context';
import { num, time, transportLabel } from '../utils/formatters';
import { type Settings, type MachineState } from '../types';


export function ConnectionFlow({ future = false }: { future?: boolean }) {
    const nodes = future
        ? [
            { name: 'ESP32', detail: 'LoRa node', icon: Cpu },
            { name: 'LoRa gateway', detail: 'Future hardware', icon: Radio },
            { name: 'Internet', detail: 'Gateway uplink', icon: Wifi },
            { name: 'Firebase', detail: 'Same data model', icon: Database }
        ]
        : [
            { name: 'ESP32', detail: 'Sensor processing', icon: Cpu },
            { name: 'Wi-Fi', detail: 'Current transport', icon: Wifi },
            { name: 'Firebase', detail: 'Realtime Database', icon: Database },
            { name: 'Dashboard', detail: 'Monitoring', icon: LayoutDashboard }
        ];

    return (
        <div className="connection-flow">
            {nodes.map((n, i) => (
                <div key={n.name} style={{ display: 'contents' }}>
                    <div className="flow-node">
                        <n.icon />
                        <div>
                            {n.name}
                            <small>{n.detail}</small>
                        </div>
                    </div>

                    {i < nodes.length - 1 && (
                        <ArrowRight className="flow-arrow" />
                    )}
                </div>
            ))}
        </div>
    );
}


export function Devices() {
    const { data, online, settings, go } = useApp();

    const demo = data.source === 'SIMULATION';

    const sensor = (key: string) => {
        const d = data.devices[key];

        if (!online || demo) {
            return demo ? 'SIMULATED' : 'OFFLINE';
        }

        return d && typeof d === 'object' && d.status
            ? String(d.status).toUpperCase()
            : 'TELEMETRY RECEIVED';
    };

    const cards = [
        {
            name: 'ESP32',
            description: 'Machine controller · edge processing',
            icon: Cpu,
            status: demo
                ? 'SIMULATED'
                : online
                    ? 'CONNECTED'
                    : 'OFFLINE',
            rows: [
                ['Machine', settings.machineId],
                [
                    'IP address',
                    demo
                        ? 'Not applicable'
                        : data.live?.ip ||
                        data.devices.ESP32?.ip ||
                        'Not reported'
                ],
                [
                    'Transport',
                    demo
                        ? 'Simulation'
                        : transportLabel(data.live?.transport)
                ],
                ['Last reading', time(data.live?.timestamp)]
            ]
        },

        {
            name: 'MPU6050',
            description: 'Vibration monitoring · inertial sensor',
            icon: Activity,
            status: sensor('MPU6050'),
            rows: [
                [
                    'Last reading',
                    online
                        ? num(data.live?.vibration) + ' g'
                        : '—'
                ],
                ['Signal', 'Vibration magnitude'],
                [
                    'Data source',
                    demo
                        ? 'Generated demo'
                        : online
                            ? 'Received telemetry'
                            : 'Waiting'
                ],
                ['Last reading', time(data.live?.timestamp)]
            ]
        },

        {
            name: 'ACS712',
            description: 'Motor current monitoring',
            icon: Zap,
            status: sensor('ACS712'),
            rows: [
                [
                    'Last reading',
                    online
                        ? num(data.live?.current) + ' A'
                        : '—'
                ],
                ['Signal', 'Motor current'],
                [
                    'Data source',
                    demo
                        ? 'Generated demo'
                        : online
                            ? 'Received telemetry'
                            : 'Waiting'
                ],
                ['Last reading', time(data.live?.timestamp)]
            ]
        },

        {
            name: 'Firebase',
            description: 'Realtime Database · telemetry storage',
            icon: Database,
            status:
                data.databaseState === 'connected'
                    ? 'CONNECTED'
                    : data.databaseState === 'error'
                        ? 'ERROR'
                        : 'OFFLINE',
            rows: [
                [
                    'Connection',
                    data.databaseState === 'unconfigured'
                        ? 'Not configured'
                        : data.databaseState
                ],
                ['Last successful sync', time(data.lastSync)],
                [
                    'Read interval',
                    settings.refreshInterval + ' seconds'
                ],
                ['Simulation storage', 'Memory only']
            ]
        }
    ];

    return (
        <>
            <div className="grid-two">
                {cards.map(c => (
                    <section
                        className="panel device-card"
                        key={c.name}
                    >
                        <div className="device-heading">
                            <c.icon />
                            <Badge state={c.status} />
                        </div>

                        <h3>{c.name}</h3>
                        <p>{c.description}</p>

                        <dl className="definition">
                            {c.rows.map(([k, v], i) => (
                                <div key={i}>
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>

            {data.error && (
                <p className="note warn">
                    {data.error}{' '}
                    <button
                        className="btn-text"
                        onClick={() => go('settings')}
                    >
                        Open Settings
                    </button>
                </p>
            )}

            <Panel
                title="Connection path"
                icon={Network}
                subtitle="Wi-Fi is the current hardware communication method"
            >
                <ConnectionFlow />
            </Panel>

            <p
                className="note"
                style={{ marginTop: 20 }}
            >
                Sensor values confirm telemetry delivery, not
                independent hardware self-tests. LoRa gateway
                support is reserved for a future extension.
            </p>
        </>
    );
}


export function Architecture() {
    const sensorNodes = [
        {
            name: 'MPU6050',
            detail: 'Vibration magnitude · g',
            icon: Activity
        },
        {
            name: 'ACS712',
            detail: 'Motor current · A',
            icon: Zap
        }
    ];

    return (
        <Panel
            title="From sensor signal to production insight"
            icon={Network}
            subtitle="Current prototype · Wi-Fi architecture"
        >
            <div className="architecture">

                <div className="arch-level">
                    {sensorNodes.map(n => (
                        <div
                            className="arch-block"
                            key={n.name}
                        >
                            <n.icon />

                            <div>
                                <strong>{n.name}</strong>
                                <span>{n.detail}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="arch-arrow">
                    <ArrowDown size={19} />
                </div>

                <div className="arch-level">
                    <div
                        className="arch-block"
                        style={{ maxWidth: 500 }}
                    >
                        <Cpu />

                        <div>
                            <strong>
                                ESP32 · Sensor processing
                            </strong>

                            <span>
                                Calibrated signals → machine state
                            </span>
                        </div>
                    </div>
                </div>

                <div className="arch-arrow">
                    <ArrowDown size={19} />

                    <span style={{ fontSize: 12 }}>
                        Wi-Fi · telemetry
                    </span>
                </div>

                <div className="arch-level">
                    <div
                        className="arch-block"
                        style={{ maxWidth: 500 }}
                    >
                        <Database />

                        <div>
                            <strong>
                                Firebase Realtime Database
                            </strong>

                            <span>
                                Live current and vibration readings
                            </span>
                        </div>
                    </div>
                </div>

                <div className="arch-arrow">
                    <ArrowDown size={19} />
                </div>

                <div className="arch-level">
                    <div
                        className="arch-block"
                        style={{ maxWidth: 500 }}
                    >
                        <LayoutDashboard />

                        <div>
                            <strong>
                                CNC monitoring dashboard
                            </strong>

                            <span>
                                Live machine monitoring
                            </span>
                        </div>
                    </div>
                </div>

                <div className="future">
                    <h3>
                        FUTURE EXTENSION / LoRa gateway
                    </h3>

                    <ConnectionFlow future />

                    <p>
                        LoRa is not connected in this prototype.
                        A future gateway can publish the same
                        telemetry.
                    </p>
                </div>
            </div>
        </Panel>
    );
}


export function Simulation() {
    const {
        data,
        settings,
        online,
        startSimulation,
        stopSimulation,
        runScenario
    } = useApp();

    const enabled =
        data.source === 'SIMULATION';

    const hardware =
        online && !enabled;

    const scenarios: {
        state: MachineState;
        name: string;
        description: string;
        icon: typeof Play;
    }[] = [
            {
                state: 'RUNNING',
                name: 'Running scenario',
                description:
                    'Stable spindle activity with natural sensor fluctuations.',
                icon: Play
            },
            {
                state: 'MICRO-STOPPAGE',
                name: 'Micro-stoppage scenario',
                description: `Drop both sensor values for ${Math.min(
                    settings.maxDuration,
                    Math.max(settings.minDuration, 7)
                )} seconds, then resume.`,
                icon: TriangleAlert
            },
            {
                state: 'IDLE',
                name: 'Idle scenario',
                description:
                    'Low machine activity.',
                icon: Pause
            },
            {
                state: 'STOPPED',
                name: 'Machine stop scenario',
                description:
                    'Machine current and vibration near zero.',
                icon: Square
            }
        ];

    return (
        <>
            <div
                className={`note ${enabled ? 'warn' : ''
                    }`}
            >
                <TriangleAlert />

                {enabled
                    ? 'Simulation Mode is enabled.'
                    : 'Demo mode is currently disabled.'}
            </div>

            <section className="panel simulation-hero">
                <div>
                    <p
                        className="eyebrow"
                        style={{ marginBottom: 8 }}
                    >
                        CONTROLLED DEMONSTRATION
                    </p>

                    <h2>
                        Simulation Mode{' '}
                        <span className="amber">
                            {enabled ? 'ON' : 'OFF'}
                        </span>
                    </h2>

                    <p>
                        {enabled
                            ? 'Use scenarios to create demo values.'
                            : 'Simulation is currently disabled.'}
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18
                    }}
                >
                    <Switch
                        aria-label="Simulation Mode"
                        checked={enabled}
                        disabled={hardware}
                        onCheckedChange={on =>
                            on
                                ? startSimulation()
                                : stopSimulation()
                        }
                    />

                    <button
                        className={`btn ${enabled ? '' : 'btn-primary'
                            }`}
                        disabled={hardware}
                        onClick={
                            enabled
                                ? stopSimulation
                                : startSimulation
                        }
                    >
                        {enabled ? <Square /> : <Play />}

                        {enabled
                            ? 'Stop Simulation'
                            : 'Start Simulation'}
                    </button>
                </div>
            </section>

            <div className="grid-two">
                {scenarios.map(s => (
                    <button
                        key={s.state}
                        className="scenario-card"
                        disabled={!enabled}
                        onClick={() =>
                            runScenario(s.state)
                        }
                    >
                        <s.icon />
                        <strong>{s.name}</strong>
                        <p>{s.description}</p>
                    </button>
                ))}
            </div>

            <Panel
                title="Demo session rules"
                icon={ShieldCheck}
            >
                <div className="panel-body">
                    <p>
                        Simulation is currently disabled in
                        the frontend-only version.
                    </p>
                </div>
            </Panel>
        </>
    );
}


export function SettingsPage() {
    const {
        settings,
        saveSettings,
        token,
        data,
        startSimulation,
        stopSimulation
    } = useApp();

    const [draft, setDraft] =
        useState<Settings>(settings);

    const [auth, setAuth] =
        useState(token);

    useEffect(() => {
        setDraft(settings);
        setAuth(token);
    }, [settings, token]);

    const field = <K extends keyof Settings>(
        key: K,
        value: Settings[K]
    ) =>
        setDraft(s => ({
            ...s,
            [key]: value
        }));


    function save() {
        if (
            !draft.machineName.trim() ||
            !/^[A-Za-z0-9_-]{1,64}$/.test(
                draft.machineId
            )
        ) {
            toast.error(
                'Use a machine name and a valid machine ID.'
            );

            return;
        }

        const numbers = [
            draft.currentThreshold,
            draft.vibrationThreshold,
            draft.minDuration,
            draft.maxDuration,
            draft.refreshInterval,
            draft.staleAfter,
            draft.cycleTime
        ];

        if (
            numbers.some(
                v => !Number.isFinite(v)
            ) ||
            draft.currentThreshold <= 0 ||
            draft.vibrationThreshold <= 0 ||
            draft.minDuration < 1 ||
            draft.maxDuration <=
            draft.minDuration ||
            draft.maxDuration > 300 ||
            draft.refreshInterval < 1 ||
            draft.refreshInterval > 60 ||
            draft.staleAfter <
            draft.refreshInterval * 2 ||
            draft.cycleTime <= 0
        ) {
            toast.error(
                'Check numeric settings.'
            );

            return;
        }

        if (
            draft.downtimeCostPerMinute !==
            null &&
            (!Number.isFinite(
                draft.downtimeCostPerMinute
            ) ||
                draft.downtimeCostPerMinute < 0)
        ) {
            toast.error(
                'Downtime cost must be non-negative.'
            );

            return;
        }

        if (
            data.source === 'SIMULATION' &&
            draft.machineId !==
            settings.machineId
        ) {
            stopSimulation();
        }

        saveSettings(
            {
                ...draft,
                machineName:
                    draft.machineName.trim(),
                databaseUrl:
                    draft.databaseUrl.trim()
            },
            auth
        );

        toast.success('Settings saved.');
    }


    return (
        <>
            <p className="note">
                These settings apply to this dashboard.
            </p>

            <div className="grid-two">

                <Panel
                    title="Machine & detection"
                    icon={Settings2}
                    className="form-section"
                >
                    <div className="panel-body field-grid">

                        <label className="field">
                            Machine name
                            <input
                                value={draft.machineName}
                                onChange={e =>
                                    field(
                                        'machineName',
                                        e.target.value
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Machine ID
                            <input
                                value={draft.machineId}
                                onChange={e =>
                                    field(
                                        'machineId',
                                        e.target.value
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Current threshold (A)

                            <input
                                type="number"
                                min="0.01"
                                step="0.05"
                                value={
                                    draft.currentThreshold
                                }
                                onChange={e =>
                                    field(
                                        'currentThreshold',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Vibration threshold (g)

                            <input
                                type="number"
                                min="0.01"
                                step="0.05"
                                value={
                                    draft.vibrationThreshold
                                }
                                onChange={e =>
                                    field(
                                        'vibrationThreshold',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Minimum micro-stop
                            (seconds)

                            <input
                                type="number"
                                min="1"
                                value={draft.minDuration}
                                onChange={e =>
                                    field(
                                        'minDuration',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Maximum micro-stop
                            (seconds)

                            <input
                                type="number"
                                min="2"
                                max="300"
                                value={draft.maxDuration}
                                onChange={e =>
                                    field(
                                        'maxDuration',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field full">
                            Estimated cycle time
                            (seconds per unit)

                            <input
                                type="number"
                                min="1"
                                value={draft.cycleTime}
                                onChange={e =>
                                    field(
                                        'cycleTime',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field full">
                            Downtime cost
                            (₹ per minute)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                    draft.downtimeCostPerMinute ??
                                    ''
                                }
                                onChange={e =>
                                    field(
                                        'downtimeCostPerMinute',
                                        e.target.value === ''
                                            ? null
                                            : Number(
                                                e.target.value
                                            )
                                    )
                                }
                            />
                        </label>
                    </div>
                </Panel>


                <Panel
                    title="Firebase connection"
                    icon={Database}
                    className="form-section"
                    action={
                        <Badge
                            state={
                                data.databaseState ===
                                    'connected'
                                    ? 'CONNECTED'
                                    : 'OFFLINE'
                            }
                        />
                    }
                >
                    <div className="panel-body field-grid">

                        <label className="field full">
                            Realtime Database URL

                            <input
                                type="url"
                                placeholder="Firebase database URL"
                                value={draft.databaseUrl}
                                onChange={e =>
                                    field(
                                        'databaseUrl',
                                        e.target.value
                                    )
                                }
                            />
                        </label>

                        <label className="field full">
                            Session Firebase ID token
                            (optional)

                            <input
                                type="password"
                                autoComplete="off"
                                value={auth}
                                onChange={e =>
                                    setAuth(e.target.value)
                                }
                            />
                        </label>

                        <label className="field">
                            Refresh interval (seconds)

                            <input
                                type="number"
                                min="1"
                                max="60"
                                value={
                                    draft.refreshInterval
                                }
                                onChange={e =>
                                    field(
                                        'refreshInterval',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                        <label className="field">
                            Offline timeout (seconds)

                            <input
                                type="number"
                                min="2"
                                value={draft.staleAfter}
                                onChange={e =>
                                    field(
                                        'staleAfter',
                                        Number(e.target.value)
                                    )
                                }
                            />
                        </label>

                    </div>
                </Panel>
            </div>


            <Panel
                title="Display & communication"
                icon={Wifi}
            >
                <div className="panel-body field-grid">

                    <label className="field">
                        Transport mode

                        <Choice
                            label="Transport mode"
                            value="WIFI"
                            onChange={() => { }}
                            options={[
                                {
                                    value: 'WIFI',
                                    label:
                                        'Wi-Fi · current prototype'
                                },
                                {
                                    value:
                                        'LORA_GATEWAY',
                                    label:
                                        'LoRa gateway · future extension',
                                    disabled: true
                                }
                            ]}
                        />
                    </label>

                    <label className="field">
                        Theme

                        <Choice
                            label="Theme"
                            value={draft.theme}
                            onChange={v =>
                                field(
                                    'theme',
                                    v as Settings['theme']
                                )
                            }
                            options={[
                                {
                                    value: 'graphite',
                                    label:
                                        'Industrial graphite'
                                },
                                {
                                    value: 'contrast',
                                    label:
                                        'High-contrast graphite'
                                }
                            ]}
                        />
                    </label>

                    <label
                        className="field"
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent:
                                'space-between'
                        }}
                    >
                        Reduce motion

                        <Switch
                            checked={
                                draft.reduceMotion
                            }
                            onCheckedChange={v =>
                                field(
                                    'reduceMotion',
                                    v
                                )
                            }
                        />
                    </label>

                    <label
                        className="field"
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent:
                                'space-between'
                        }}
                    >
                        Simulation Mode

                        <Switch
                            checked={
                                data.source ===
                                'SIMULATION'
                            }
                            onCheckedChange={v =>
                                v
                                    ? startSimulation()
                                    : stopSimulation()
                            }
                        />
                    </label>
                </div>

                <div className="form-footer">
                    <span>
                        Preferences are saved on
                        this device.
                    </span>

                    <div className="head-actions">
                        <button
                            className="btn"
                            onClick={() => {
                                setDraft(settings);
                                setAuth(token);
                            }}
                        >
                            Discard changes
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={save}
                        >
                            <Save />
                            Save settings
                        </button>
                    </div>
                </div>
            </Panel>
        </>
    );
}