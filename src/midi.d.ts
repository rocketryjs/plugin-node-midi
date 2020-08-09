declare module "midi" {
	export abstract class GenericIO {
		getPortCount (): number;
		getPortName (portNum: number): string;
		openPort (portNum: number): void;
		closePort (): void;
	}
	export type input = Input;
	export interface Listener {
		(deltaTime: number, message: Array<number>): void
	}
	export type EventNames = "message";
	export class Input extends GenericIO implements NodeJS.EventEmitter {
		addListener (event: EventNames, listener: Listener): this;
		on (event: EventNames, listener: Listener): this;
		once (event: EventNames, listener: Listener): this;
		removeListener (event: EventNames, listener: Listener): this;
		off (event: EventNames, listener: Listener): this;
		removeAllListeners (event?: EventNames): this;
		setMaxListeners (n: number): this;
		getMaxListeners (): number;
		listeners (event: EventNames): Function[];
		rawListeners (event: EventNames): Function[];
		emit (event: EventNames, ...args: Parameters<Listener>): boolean;
		listenerCount (type: EventNames): number;
		prependListener (event: EventNames, listener: Listener): this;
		prependOnceListener (event: EventNames, listener: Listener): this;
		eventNames (): Array<EventNames>;
		ignoreTypes (sysEx: boolean, beatClock: boolean, activeSensing: boolean): void;
	}
	export type output = Output;
	export class Output extends GenericIO {
		sendMessage (message: Array<number>): void;
	}
}
