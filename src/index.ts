/*
	Module: Index - Plugin node-midi
	Description: Plugin that enables `node-midi` support
*/
import midi from "midi";


// Get MIDI I/O
export const createMidiIO = () => {
	try {
		return {
			// Gets a MIDI input
			"input": new midi.input(),
			// Gets a MIDI output
			"output": new midi.output()
		};
	} catch (error) {
		throw new Error("Couldn't create MIDI I/O (in plugin-node-midi).\n\n" + error);
	}
};
