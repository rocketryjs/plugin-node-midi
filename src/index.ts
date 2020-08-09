import {
	rocketry, MIDILayerAPI, Message, MIDIOptions, PortNumbers, Device, DevicePort, DevicePorts, MIDILayerAPIClass,
} from "@rocketry/core";
import midi from "midi";


const throwMissingMIDIError = () => {throw new Error("No MIDI plugin is registered with Rocketry.");};

export interface NodeMIDIOptions extends MIDIOptions {
	beatClock: boolean;
	activeSensing: boolean;
}

export class NodeMIDI implements MIDILayerAPI {
	static inputPortsOpened: Set<number> = new Set();
	static outputPortsOpened: Set<number> = new Set();
	options: NodeMIDIOptions = {sysEx: true, beatClock: false, activeSensing: false};
	private device: Device;
	private input?: midi.input;
	private output?: midi.output;
	private ports?: PortNumbers;

	constructor (device: Device, options?: Partial<NodeMIDIOptions>) {
		this.device = device;

		// Extend options
		if (options) {
			Object.assign(this.options, options);
		}

		// Connect to Node MIDI
		try {
			const input = this.input = new midi.Input();
			this.output = new midi.Output();

			// Allow responses of SysEx, MIDI beat clock, and active sensing messages
			// Inverted as they are ignore types in node-midi's API
			input.ignoreTypes(!this.options.sysEx, !this.options.beatClock, !this.options.activeSensing);
		} catch (error) {
			throw new Error(`Couldn't create MIDI I/O (in plugin-node-midi).\n\n${(error as Error).toString()}`);
		}
	}

	connect (ports: PortNumbers): void {
		if (!this.input || !this.output) return throwMissingMIDIError();

		this.ports = ports;

		try {
			// Open ports
			this.input.openPort(ports.input);
			NodeMIDI.inputPortsOpened.add(ports.input);
			this.output.openPort(ports.output);
			NodeMIDI.outputPortsOpened.add(ports.output);
		} catch (error) {
			throw new Error(`Failed to open a MIDI port. Check your port and connection to your device.\n\n${(error as Error).toString()}`);
		}
	}

	disconnect (): void {
		if (!this.input || !this.output) return throwMissingMIDIError();
		if (!this.ports) throw new Error("There aren't ports available to disconnect from. Is the I/O actually opened?");

		try {
			this.input.closePort();
			NodeMIDI.inputPortsOpened.delete(this.ports.input);
			this.output.closePort();
			NodeMIDI.outputPortsOpened.delete(this.ports.output);
		} catch (error) {
			throw new Error(`Couldn't close MIDI I/O.\n\n${(error as Error).toString()}`);
		}
	}

	send (message: Message): void {
		if (!this.input || !this.output) return throwMissingMIDIError();

		try {
			this.output.sendMessage(message);
		} catch (error) {
			throw new Error(`Unknown error while sending message (in plugin-node-midi).\n\n${(error as Error).toString()}`);
		}
	}

	addListeners (): void {
		if (!this.input) return throwMissingMIDIError();
		this.input.on("message", this.device.receive.bind(this.device));
	}

	removeListeners (): void {
		if (!this.input) return throwMissingMIDIError();
		this.input.removeAllListeners();
	}

	getAllPortNumbers (regex?: RegExp): DevicePorts {
		if (!this.input || !this.output) return throwMissingMIDIError();

		return {
			input: this.getPortNumbersByPort(this.input, regex),
			output: this.getPortNumbersByPort(this.output, regex),
		};
	}

	// Gets the ports that match the input regex
	getPortNumbersByPort (port: midi.input | midi.output, regex?: RegExp): Array<DevicePort> {
		const portCount = port.getPortCount();
		const ports = [];

		// For all ports in input/output
		for (let number = 0; number < portCount; number++) {
			const name = this.getPortName(port, number);
			if (regex && !regex.test(name)) {
				// Skip if not matched
				continue;
			}
			ports.push({name, number});
		}

		return ports;
	}

	// Get a port's name
	getPortName (port: midi.input | midi.output, num: number): string {
		// Get name from node-midi
		const name = port.getPortName(num);
		if (name) {
			// Return the port name with the port number at the end removed
			// - This is found on at least Windows machines
			const suffixedPortNum = new RegExp(`(?<name>.+)(?: ${num})$`);
			return suffixedPortNum.exec(name)?.groups?.name || name;
		} else {
			throw new Error(`There's no device at the port number ${num}`);
		}
	}
}


declare module "@rocketry/core" {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface RegisteredMIDILayer extends MIDILayerAPIClass<NodeMIDIOptions, NodeMIDI> {}
}
rocketry.registerMIDILayer(NodeMIDI);
