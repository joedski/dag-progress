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

test( `graph should produce same result as hand calculated result`, t => {
	let graph = new Map([
		[ "Start", new Set([ "Decide", "OhOkay" ]) ],
		[ "Decide", new Set([ "DoOneThing", "StillNo" ]) ],
		[ "DoOneThing", new Set([ "DoAnother" ]) ],
		[ "OhOkay", new Set([ "StillNo" ]) ],
		[ "DoAnother", new Set([ "WellThatWasFun" ]) ],
		[ "StillNo", new Set([ "WellThatWasFun" ]) ],
		[ "WellThatWasFun", new Set([ "Bye" ]) ],
	]);

	let progresses = dagProgress( graph );

	let progressOf = ( fraction ) => ({
		value: Number( fraction ),
		fraction
	});

	let expectedProgresses = new Map([
		[ "Start", progressOf( new Fraction( 1, 6 ) ) ],
		[ "Decide", progressOf( new Fraction( 2, 6 ) ) ],
		[ "OhOkay", progressOf( new Fraction( 2, 5 ) ) ],
		[ "DoOneThing", progressOf( new Fraction( 3, 6 ) ) ],
		[ "DoAnother", progressOf( new Fraction( 4, 6 ) ) ],
		[ "StillNo", progressOf( new Fraction( 3, 5 ) ) ],
		[ "WellThatWasFun", progressOf( new Fraction( 5, 6 ) ) ],
		[ "Bye", progressOf( new Fraction( 6, 6 ) ) ],
	]);

	t.plan( expectedProgresses.size );

	expectedProgresses.forEach( ( p, v ) => {
		t.is( p.value, progresses.get( v ).value, 
			`Vertex "${ v }" should have progress ${ p.fraction.toFraction() }.` );
	});
});
