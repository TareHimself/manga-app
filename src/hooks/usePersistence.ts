import { EventEmitter } from 'events';
import { useCallback, useRef, useState } from "react";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import useMounted from "./useMounted";

declare global {
	var persistenceEmitters: Map<string, EventEmitter>;
}

global.persistenceEmitters = new Map<string, EventEmitter>();

export interface persistenceInstanceUpdate<T> { id: string, event: string, payload: T };

export default function usePersistence<T = any>(id: string): { sendEvent: (event: string, payload: T) => void; removeCallback: (event: string, callback: (payload: T) => void) => void; addCallback: (event: string, callback: (payload: T) => void) => () => void; tryUpdateState: () => void; } {

	if (!persistenceEmitters.get(id)) persistenceEmitters.set(id, new EventEmitter())

	const emitter = useRef(persistenceEmitters.get(id)!).current;

	const hasPendingUpdateRef = useRef(false);

	const callbacks = useRef(new Map()).current;

	const instanceId = useRef(uuidv4()).current;

	const IsMounted = useMounted();

	const [, renderCount] = useState(0);

	const tryUpdateState = useCallback(() => {
		if (IsMounted()) {
			renderCount(c => c + 1);
			hasPendingUpdateRef.current = false;
		}
	}, [renderCount]);

	const sendEvent = useCallback((event: string, payload: T) => {
		const args: persistenceInstanceUpdate<T> = { id: instanceId, event, payload };
		emitter.emit(event, args);
	}, [callbacks]);

	const removeCallback = useCallback((event: string, callback: (payload: T) => void) => {
		if (callbacks.get(callback)) {
			emitter.off(event, callbacks.get(callback)!);
			callbacks.delete(callback);
		}
	}, [callbacks]);

	// adds a callback and returns a function to remove the callback
	const addCallback = useCallback((event: string, callback: (payload: T) => void) => {
		function handler(args: persistenceInstanceUpdate<T>) {
			if (args.id === instanceId) return
			callback(args.payload);
		}
		callbacks.set(callback, handler);
		emitter.on(event, handler);
		return () => { removeCallback(event, callback) }
	}, [callbacks, removeCallback]);

	return { sendEvent, addCallback, removeCallback, tryUpdateState }
}