import test from 'ava';
import dagProgress from '../source';
import Fraction from 'fraction.js';
import toposort from 'toposort';



test( `the same graph in different valid topological orders should produce the same vertex progress values`, t => {
	let graphA = new Map([
		[ "Start", new Set([ "Decide", "OhOkay" ]) ],
		[ "Decide", new Set([ "DoOneThing", "StillNo" ]) ],
		[ "DoOneThing", new Set([ "DoAnother" ]) ],
		[ "OhOkay", new Set([ "StillNo" ]) ],
		[ "DoAnother", new Set([ "WellThatWasFun" ]) ],
		[ "StillNo", new Set([ "WellThatWasFun" ]) ],
		[ "WellThatWasFun", new Set([ "Bye" ]) ],
	]);

	// Differs by the order of next vertices from "Start" and "Decide".
	let graphB = new Map([
		[ "Start", new Set([ "OhOkay", "Decide" ]) ],
		[ "Decide", new Set([ "StillNo", "DoOneThing" ]) ],
		[ "OhOkay", new Set([ "StillNo" ]) ],
		[ "DoOneThing", new Set([ "DoAnother" ]) ],
		[ "DoAnother", new Set([ "WellThatWasFun" ]) ],
		[ "StillNo", new Set([ "WellThatWasFun" ]) ],
		[ "WellThatWasFun", new Set([ "Bye" ]) ],
	]);

	let progressesA = dagProgress( graphA );
	let progressesB = dagProgress( graphB );

	t.plan( progressesA.size );

	progressesA.forEach( ( progress, v ) => {
		t.true( progress.fraction.equals( progressesB.get( v ).fraction ) );
	});
});
