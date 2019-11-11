/*
	Module: Index - Plugin node-midi
	Description: Plugin that enables `node-midi` support
*/
import midi from "midi";
import {registerMidiLayer} from "@rocketry/core";
import {MidiLayerAPI, MessageType, MIDIOptions, PortsType} from "@rocketry/core/src/types"; // TODO


// TODO: bind functions


// Create MIDI I/O
export const createMidiIO = function (this: MidiLayerAPI, options: MIDIOptions = {sysex: true, beatclock: false, activesensing: false}) {
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

// disconnect
// emit

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
};

export const getDevices = function (this: MidiLayerAPI) {

};


registerMidiLayer({init, createMidiIO, connect, disconnect, emit, send, getDevices});
