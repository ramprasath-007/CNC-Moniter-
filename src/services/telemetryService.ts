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

const ESP32_TIMEOUT = 10000; // 10 seconds

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

        let latestTelemetry: Telemetry | null = null;
        let latestLastSeen = 0;

        // -----------------------------------------
        // Firebase realtime listener
        // -----------------------------------------
        const unsubscribe = onValue(
            liveRef,

            (snapshot) => {
                if (!snapshot.exists()) {
                    latestTelemetry = null;
                    latestLastSeen = 0;

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

                const lastSeen =
                    typeof value.lastSeen === 'number'
                        ? value.lastSeen
                        : Number(value.lastSeen) || 0;

                latestLastSeen = lastSeen;

                const telemetry: Telemetry = {
                    machineId: 'CNC01',

                    // Use ESP32/Firebase timestamp
                    timestamp: lastSeen || Date.now(),

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

                latestTelemetry = telemetry;

                const isOnline =
                    lastSeen > 0 &&
                    Date.now() - lastSeen <= ESP32_TIMEOUT;

                setData((previous) => ({
                    ...previous,

                    source: isOnline
                        ? 'HARDWARE'
                        : previous.source,

                    live: isOnline
                        ? telemetry
                        : null,

                    history: isOnline
                        ? [
                            ...previous.history.slice(-99),
                            telemetry,
                        ]
                        : previous.history,

                    databaseState: 'connected',
                    error: '',

                    lastSync: isOnline
                        ? lastSeen
                        : previous.lastSync,

                    ready: true,
                }));
            },

            (error) => {
                console.error('Firebase read error:', error);

                setData((previous) => ({
                    ...previous,
                    live: null,
                    databaseState: 'error',
                    error: 'Firebase connection failed.',
                    ready: true,
                }));
            }
        );

        // -----------------------------------------
        // ESP32 heartbeat checker
        // -----------------------------------------
        const heartbeatChecker = window.setInterval(() => {
            if (!latestTelemetry || !latestLastSeen) {
                return;
            }

            const age =
                Date.now() - latestLastSeen;

            if (age > ESP32_TIMEOUT) {
                setData((previous) => {
                    if (previous.live === null) {
                        return previous;
                    }

                    return {
                        ...previous,

                        // Old sensor values are no longer live
                        live: null,

                        databaseState: 'connected',

                        error: '',

                        ready: true,
                    };
                });
            }
        }, 1000);

        // -----------------------------------------
        // Cleanup
        // -----------------------------------------
        return () => {
            unsubscribe();
            window.clearInterval(heartbeatChecker);
        };
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