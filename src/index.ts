/*
	Module: Index - Plugin node-midi
	Description: Plugin that enables `node-midi` support
*/
import midi from "midi";
import {registerMidiLayer} from "@rocketry/core";
import {MidiLayerAPI, MessageType, MIDIOptions, PortsType} from "@rocketry/core/src/types"; // TODO
import {IOPortsType, SingleIOPortType} from "./types";


// TODO: bind functions


// Create MIDI I/O
export const createMidiIO = function (this: MidiLayerAPI, options: MIDIOptions = {sysex: true, beatclock: false, activesensing: false}): IOPortsType {
	try {
		const input = new midi.input();
		const output = new midi.output();

		// Allow responses of SysEx, MIDI beat clock, and active sensing messages
		// Inverted as they are ignore types in node-midi's API
		input.ignoreTypes(!options.sysex, !options.beatclock, !options.activesensing);
		this.sysexEnabled = options.sysex;

		return {input, output};
	} catch (error) {
		throw new Error(`Couldn't create MIDI I/O (in plugin-node-midi).\n\n${error}`);
	}
};

export const connect = function (this: MidiLayerAPI, device: DeviceType, ports?: PortsType, options?: MIDIOptions): void {
	// Create MIDI I/O when re-opening after closing
	if (!device.input || !device.output) {
		Object.assign(device, createMidiIO.call(this, options));
	}

	try {
		// Open ports
		device.input.openPort((ports || device.portNums).input);
		device.output.openPort((ports || device.portNums).output);

		// Start receiving MIDI messages for this device and relay them to Buttons through `receive()`
		device.input.on("message", device.receive);

		// Notify device open
		device.emit("open");
	} catch (error) {
		throw new Error(`Failed to open a MIDI port. Check your port and connection to your device.\n\n${error}`);
	}
};

export const disconnect = function (this: MidiLayerAPI, device: DeviceType, ports?: PortsType, options?: MIDIOptions): void {
	try {
		// Notify closure
		device.emit("close");

		device.input.closePort();
		device.output.closePort();

		delete device.input;
		delete device.output;
	} catch (error) {
		throw new Error(`Couldn't close MIDI I/O.\n\n${error}`);
	}
};

export const emit = function (this: MidiLayerAPI, device: DeviceType, ports?: PortsType, options?: MIDIOptions): void {

};

export const send = function (this: MidiLayerAPI, device: DeviceType, message: MessageType) {
	try {
		device.output.sendMessage(message);
	} catch (error) {
		// TODO
		switch (error.name) {
			default: {
				throw new Error(`Unknown error while sending message (in plugin-web-midi).\n\n${error}`);
			}
		}
	}
};

// TODO: store the MIDIIO somewhere now that some major bugs are fixed upstream
// TODO: standardize the parameters when ports can be given


export const getDevices = function (this: MidiLayerAPI, midiIO?: IOPortsType) {
	if (!midiIO) {
		midiIO = this.createMidiIO();
	}



	for (const port of midiIO) {
		port
	}
};

// Find next device that's not already open
export const getNextDevice = function (inputPort: midi.input, outputPort: midi.output) {
	const devices = this.getDevice(inputPort, outputPort);
	for (const device of devices) {
		// Use this device if not already opened
		let isOpened;
		for (const value of this.opened.values()) {
			if (_.isMatch(value, device)) {
				isOpened = true;
			}
		}
		// console.log(isOpened)
		if (!isOpened) {
			return device;
		}
	}

	return false;
};


// Generator for getting devices
export const getDevice = function* (inputPort: midi.input, outputPort: midi.output) {
	// Generate input port numbers
	const inputPortNums = this.getPort(inputPort);
	// Generate output port numbers
	const outputPortNums = this.getPort(outputPort);

	// While not out of either, make pairs for devices
	while (true) {
		const input = inputPortNums.next();
		const output = outputPortNums.next();

		if (input.done || output.done) {
			return;
		} else {
			yield {
				"input": input.value,
				"output": output.value,
			};
		}
	}
};
// Gets the ports that match the supported regex
export const getPort = function* (port: SingleIOPortType) {
	const portCount = port.getPortCount();

	// For all ports in input/output
	for (let i = 0; i < portCount; i++) {
		if (this.getPortName(port, i).match(this.regex)) {
			yield i;
		}
	}
};


// Get a port's name
export const getPortName = function (port: SingleIOPortType, num: number) {
	// Get name from node-midi
	const name = port.getPortName(num);
	// Return the port name with the port number at the end removed
	if (name) {
		return name.match(/(.+)(?:\s+\d*)$/i)[1];
	} else {
		throw new Error("There's no device at the port number " + num);
	}
};
// Get a device name based off a device's port names
export const getDeviceName = function (inputPort: midi.input, outputPort: midi.output, inputNum: number, outputNum: number) {
	let name;
	const inputName = this.getPortName(inputPort, inputNum);
	const outputName = this.getPortName(outputPort, outputNum);

	// If the input's name and output matches (setting name to the input's)
	if ((name = inputName) === outputName) {
		return name;
	} else {
		throw new Error(`Your device's output port's name doesn't match your input port's name (${name}).`);
	}
};

/*
// Get all type names, or regex strings that get a type
get regex() {
	const types = [];
	for (const key in this.devices) {
		if (this.devices[key].regex) {
			types.push(this.devices[key].regex);
		} else {
			types.push(this.devices[key].type);
		}
	}

	// Generate and return regex from above
	return new RegExp(`^(?:${types.join(")|(?:")})$`, "i");
},
*/


// Run the regex for the supported devices, getting the first capture group
/*
	Example:
		From: "3- Launchpad MK2" (not a key in `devices`, from port names)
		To: "Launchpad MK2" (is a key, from the device's class's regex getter's first capture group)
*/
export const getMatchingKey = function (name: string) {
	const match = name.match(this.regex);

	if (match) {
		// Return either the first capture group in the match (in case of regex) or the match (in case of string or regex without a first capture group)
		return match[1] || match;
	} else {
		throw new Error(`Your device, ${name}, is not supported.`);
	}
};

registerMidiLayer({
	// init, TODO
	createMidiIO, connect, disconnect, emit, send, getDevices});
