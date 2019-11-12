import midi from "midi";

export type IOPortsType = {
	input: midi.input,
	output: midi.output,
};
export type SingleIOPortType = midi.input | midi.output;
