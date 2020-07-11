/*
	Module: Index - Plugin node-midi
	Description: Plugin that enables `node-midi` support
*/
import midi from "midi";
import {
	MIDILayerAPI, MessageType, MIDIOptions, PortsType
} from "@rocketry/core/src/types"; // TODO


export interface NodeMIDIOptions extends MIDIOptions {
	beatclock: boolean;
	activesensing: boolean;
}

export const inputPortsOpened = new Set();
export const outputPortsOpened = new Set();

export class NodeMIDI implements MIDILayerAPI {
	options: NodeMIDIOptions = {sysex: true, beatclock: false, activesensing: false};
	private input?: midi.input;
	private output?: midi.output;
	private ports?: PortsType;

	constructor (options?: Partial<NodeMIDIOptions>) {
		// Extend options
		if (options) {
			Object.assign(this.options, options);
		}

		// Connect to Node MIDI
		try {
			const input = this.input = new midi.input();
			this.output = new midi.output();

			// Allow responses of SysEx, MIDI beat clock, and active sensing messages
			// Inverted as they are ignore types in node-midi's API
			input.ignoreTypes(!this.options.sysex, !this.options.beatclock, !this.options.activesensing);
		} catch (error) {
			throw new Error(`Couldn't create MIDI I/O (in plugin-node-midi).\n\n${error}`);
		}
	}

	connect (ports: PortsType) {
		if (!this.input || !this.output) {
			return false;
		}

		this.ports = ports;

		try {
			// Open ports
			this.input.openPort(ports.input);
			inputPortsOpened.add(ports.input);
			this.output.openPort(ports.output);
			outputPortsOpened.add(ports.output);
		} catch (error) {
			throw new Error(`Failed to open a MIDI port. Check your port and connection to your device.\n\n${error}`);
		}
	}

	disconnect () {
		if (!this.input || !this.output || !this.ports) {
			return false;
		}

		try {
			this.input.closePort();
			inputPortsOpened.delete(this.ports.input);
			this.output.closePort();
			outputPortsOpened.delete(this.ports.output);
		} catch (error) {
			throw new Error(`Couldn't close MIDI I/O.\n\n${error}`);
		}
	}

	send (message: MessageType) {
		if (!this.input || !this.output) {
			return false;
		}

		try {
			this.output.sendMessage(message);
		} catch (error) {
			throw new Error(`Unknown error while sending message (in plugin-node-midi).\n\n${error}`);
		}
	}

	getAllPortNumbers (regex?: RegExp) {
		if (!this.input || !this.output) {
			return false;
		}

		// Generate port numbers
		const input = [...this.getPortNumbersByPort(this.input, regex)];
		const output = [...this.getPortNumbersByPort(this.output, regex)];

		return {input, output};
	}

	// Gets the ports that match the input regex
	* getPortNumbersByPort (port: midi.input | midi.output, regex?: RegExp) {
		const portCount = port.getPortCount();

		// For all ports in input/output
		for (let number = 0; number < portCount; number++) {
			const name = this.getPortName(port, number);
			if (regex && !regex.test(name)) {
				// Skip if not matched
				continue;
			}
			yield {name, number};
		}
	};

	// Get a port's name
	getPortName (port: midi.input | midi.output, num: number) {
		// Get name from node-midi
		const name = port.getPortName(num);
		if (name) {
			// Return the port name with the port number at the end removed
			// - This is found on at least Windows machines
			const suffixedPortNum = new RegExp(`(?<name>.+)(?: ${num})$`);
			return suffixedPortNum.exec(name)?.groups?.name || name;
		} else {
			throw new Error("There's no device at the port number " + num);
		}
	};
}
