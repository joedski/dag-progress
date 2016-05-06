import test from 'ava';
import dagProgress from '../source';
import Fraction from 'fraction.js';
import toposort from 'toposort';



test( `normalizeAdjacencies should produce two entries in the adjacencies list of a graph of two vertices`, t => {
	let graph = new Map([
		[ "Hello", new Set([ "Friend" ]) ]
	]);

	let normalized = dagProgress.normalizeAdjacencies( graph );

	t.is( normalized.size, 2,
		`normalized should have two entries.` );

	t.true( normalized.has( "Friend" ),
		`The entry "Friend" should be in normalized.` );

	t.is( normalized.get( "Friend" ).size, 0,
		`Entry "Friend" should point to a size-0 set.` );
});



test( `reverse should have the same number of entries as a normalized forward adjacency list`, t => {
	let graph = new Map([
		[ "Hello", new Set([ "Friend" ]) ]
	]);

	let normalized = dagProgress.normalizeAdjacencies( graph );
	let reversed = dagProgress.reverse( normalized );

	t.is( reversed.size, normalized.size,
		`reversed should have the same size as normalized.` );

	t.true( reversed.has( "Hello" ),
		`The entry "Hello" should be in reversed.` );

	t.is( reversed.get( "Hello" ).size, 0,
		`Entry "Hello" should point to a size-0 set.` );
});



test( `a graph of 1 vertex should be the same after being reversed`, t => {
	let graph = new Map([
		[ "All Alone :(", new Set() ]
	]);

	let reversed = dagProgress.reverse( graph );

	t.is( graph.size, reversed.size,
		`A normalized graph and its reverse should be the same size.` );

	t.true( reversed.has( "All Alone :(" ),
		`The reversed graph should have an entry for "All Alone :("` );

	t.is( reversed.get( "All Alone :(" ).size, 0,
		`The reversed graph should have an empty set as the value of the entry for "All Alone :("` );
});



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



test( `longestBefore, longestAfter, and own should, when calculated together, yield a fraction of the same value`, t => {
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

	// let expectedProgresses = new Map([
	// 	[ "Start", progressOf( new Fraction( 1, 6 ) ) ],
	// 	[ "Decide", progressOf( new Fraction( 2, 6 ) ) ],
	// 	[ "OhOkay", progressOf( new Fraction( 2, 5 ) ) ],
	// 	[ "DoOneThing", progressOf( new Fraction( 3, 6 ) ) ],
	// 	[ "DoAnother", progressOf( new Fraction( 4, 6 ) ) ],
	// 	[ "StillNo", progressOf( new Fraction( 3, 5 ) ) ],
	// 	[ "WellThatWasFun", progressOf( new Fraction( 5, 6 ) ) ],
	// 	[ "Bye", progressOf( new Fraction( 6, 6 ) ) ],
	// ]);

	t.plan( progresses.size );

	progresses.forEach( ( p, v ) => {
		let { fraction, longestBefore, longestAfter, own } = p;
		let calculatedFraction = new Fraction( longestBefore + own, longestBefore + longestAfter + own );

		let isEqual = fraction.d === calculatedFraction.d && fraction.n === calculatedFraction.n;

		t.true( isEqual,
			`Vertex "${ v }" calculated fraction ${ calculatedFraction.toFraction() } should equal algorithm-generated fraction ${ p.fraction.toFraction() }.` );
	});
});



test( `graph with no-progress vertices at end should have progress values of 1 for all such vertices`, t => {
	let graph = new Map([
		[ "Start", new Set([ "Middle 1", "Middle 2" ]) ],
		[ "Middle 1", new Set([ "Middle 3" ]) ],
		[ "Middle 2", new Set([ "Middle 3" ]) ],
		[ "Middle 3", new Set([ "End 1" ]) ],
		[ "End 1", new Set([ "End 2" ]) ],
	]);

	let options = new Map([
		[ "End 1", { progress: false } ],
		[ "End 2", { progress: false } ],
	]);

	let progresses = dagProgress( graph, options );

	t.is(
		progresses.get( 'End 1' ).fraction.n,
		progresses.get( 'End 1' ).fraction.d,
		`"End 1" should have a progress fraction that equals 1.` );

	t.is(
		progresses.get( 'End 2' ).fraction.n,
		progresses.get( 'End 2' ).fraction.d,
		`"End 2" should have a progress fraction that equals 1.` );
});



test( `graph with no-progress vertices at start should have progress values of 0 for all such vertices`, t => {
	let graph = new Map([
		[ "Start 1", new Set([ "Start 2" ]) ],
		[ "Start 2", new Set([ "Middle 1", "Middle 2" ]) ],
		[ "Middle 1", new Set([ "Middle 3" ]) ],
		[ "Middle 2", new Set([ "Middle 3" ]) ],
		[ "Middle 3", new Set([ "End 1" ]) ],
		[ "End 1", new Set([ "End 2" ]) ],
	]);

	let options = new Map([
		[ "Start 1", { progress: false } ],
		[ "Start 2", { progress: false } ],
	]);

	let progresses = dagProgress( graph, options );

	t.is( progresses.get( 'Start 1' ).fraction.n, 0,
		`"Start 1" should have a progress fraction that equals 0.` );
	t.not( progresses.get( 'Start 1' ).fraction.d, 0,
		`"Start 1" should have a progress fraction with non-0 denominator.` );

	t.is( progresses.get( 'Start 2' ).fraction.n, 0,
		`"Start 2" should have a progress fraction that equals 0.` );
	t.not( progresses.get( 'Start 2' ).fraction.d, 0,
		`"Start 2" should have a progress fraction with non-0 denominator.` );
});



test( `graph with only one vertex and no edges should have progress of 1 for that vertex if progress:true`, t => {
	let progressOf = ( fraction ) => ({
		value: Number( fraction ),
		fraction
	});

	let graph = new Map([
		[ "I'm all alone :(", new Set() ]
	]);

	let expectedProgresses = new Map([
		[ "I'm all alone :(", progressOf( new Fraction( 0, 1 ) ) ]
	]);

	let progresses = dagProgress( graph );

	t.true( progresses.has( "I'm all alone :(" ),
		`Resultant progresses has a value for "I'm all alone :(".` );

	t.is( progresses.get( "I'm all alone :(" ).value, 1,
		`Resultant progress value for "I'm all alone :(" is 1.` );
});
