'use client';

import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '../firebase';

import {
    defaults,
    initialSnapshot,
    type Settings,
    type MachineState,
    type Telemetry,
} from '../types';

export function useTelemetry() {
    const [settings, setSettings] = useState<Settings>(defaults);
    const [token, setToken] = useState('');

    const [data, setData] = useState({
        ...initialSnapshot,
        databaseState: 'connecting' as const,
        ready: true,
    });

    useEffect(() => {
        const liveRef = ref(database, 'machines/CNC01/live');

        const unsubscribe = onValue(
            liveRef,

            (snapshot) => {
                if (!snapshot.exists()) {
                    setData((previous) => ({
                        ...previous,
                        live: null,
                        databaseState: 'connected',
                        error: '',
                        ready: true,
                    }));

                    return;
                }

                const value = snapshot.val();

                const telemetry: Telemetry = {
                    machineId: 'CNC01',
                    timestamp: Date.now(),

                    current:
                        typeof value.current === 'number'
                            ? value.current
                            : Number(value.current) || 0,

                    vibration:
                        typeof value.vibration === 'number'
                            ? value.vibration
                            : Number(value.vibration) || 0,

                    machineStatus: (
                        value.status || 'OFFLINE'
                    ) as MachineState,

                    microStoppage:
                        value.status === 'MICRO-STOPPAGE',

                    stoppageDuration: 0,

                    transport: 'WIFI',
                };

                setData((previous) => ({
                    ...previous,
                    source: 'HARDWARE',
                    live: telemetry,

                    history: [
                        ...previous.history.slice(-99),
                        telemetry,
                    ],

                    databaseState: 'connected',
                    error: '',
                    lastSync: Date.now(),
                    ready: true,
                }));
            },

            (error) => {
                console.error('Firebase read error:', error);

                setData((previous) => ({
                    ...previous,
                    databaseState: 'error',
                    error: 'Firebase connection failed.',
                    ready: true,
                }));
            }
        );

        return () => unsubscribe();
    }, []);

    function saveSettings(
        next: Settings,
        authToken = token
    ) {
        setSettings(next);
        setToken(authToken);

        return next;
    }

    function startSimulation() {
        return false;
    }

    function stopSimulation() {
        return;
    }

    function runScenario(_state: MachineState) {
        return false;
    }

    return {
        data,
        settings,
        token,
        saveSettings,
        startSimulation,
        stopSimulation,
        runScenario,
    };
}