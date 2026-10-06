'use client';
import {createContext,useContext} from 'react';
import type {useTelemetry} from './services/telemetryService';
import type {StoppageEvent} from './types';
export type AppContextValue=ReturnType<typeof useTelemetry>&{now:number;online:boolean;go:(page:string)=>void;openEvent:(event:StoppageEvent)=>void};
export const AppContext=createContext<AppContextValue|null>(null);
export function useApp(){const c=useContext(AppContext);if(!c)throw new Error('Missing app context');return c;}
