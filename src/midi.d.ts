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
	// TODO [typescript@>=4.1.0]: Remove eslint ignore after the following is fixed
	// https://github.com/microsoft/TypeScript/issues/37901
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	export class Input extends GenericIO implements NodeJS.EventEmitter {
		addListener (event: EventNames, listener: Listener): this;
		on (event: EventNames, listener: Listener): this;
		once (event: EventNames, listener: Listener): this;
		removeListener (event: EventNames, listener: Listener): this;
		off (event: EventNames, listener: Listener): this;
		removeAllListeners (event?: EventNames): this;
		setMaxListeners (n: number): this;
		getMaxListeners (): number;
		// Preserve types from EventEmitter
		/* eslint-disable @typescript-eslint/ban-types */
		listeners (event: EventNames): Array<Function>;
		rawListeners (event: EventNames): Array<Function>;
		/* eslint-enable @typescript-eslint/ban-types */
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
