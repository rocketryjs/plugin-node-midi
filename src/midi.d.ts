declare module "midi" {
	export class GenericIO {
		getPortCount(): number;
		getPortName(portNum: number): string;
		openPort(portNum: number): void;
		closePort(): void;
	}
	export class input extends GenericIO {
		on(eventName: string, callback: {(deltaTime: number, message: Array<number>): void}): void;
		ignoreTypes(sysex: boolean, beatclock: boolean, activesensing: boolean): void;
	}
	export class output extends GenericIO {
		sendMessage(message: Array<number>): void;
	}
}
