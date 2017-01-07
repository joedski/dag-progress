import test from 'ava';
import { eachProp, has } from '../source/utils';
import dagProgress, {
	normalizeAdjacencies,
	reverse,
	normalizedVertexOptions,
	topologicalOrder,
	pathLengths,
} from '../source';

function size( object ) {
	return Object.keys( object ).length;
}



// test( `correct output`, t => {
// 	let graph = {
// 		"Start": new Set([ "Decide", "OhOkay" ]),
// 		"Decide": new Set([ "DoOneThing", "StillNo" ]),
// 		"DoOneThing": new Set([ "DoAnother" ]),
// 		"OhOkay": new Set([ "StillNo" ]),
// 		"DoAnother": new Set([ "WellThatWasFun" ]),
// 		"StillNo": new Set([ "WellThatWasFun" ]),
// 		"WellThatWasFun": new Set([ "Bye" ]),
// 	};

// 	let progresses = dagProgress( graph );

// 	t.snapshot( progresses );
// });



test( `normalizeAdjacencies should produce two entries in the adjacencies list of a graph of two vertices`, t => {
	let graph = {
		"Hello": [ "Friend" ],
	};

	let normalized = normalizeAdjacencies( graph );

	t.is( size( normalized ), 2,
		`normalized should have two entries.` );

	t.true( has( normalized, "Friend" ),
		`The entry "Friend" should be in normalized.` );

	t.is( normalized.Friend.length, 0,
		`Entry "Friend" should point to a size-0 set.` );
});



test( `reverse should have the same number of entries as a normalized forward adjacency list`, t => {
	let graph = {
		"Hello": [ "Friend" ],
	};

	let normalized = normalizeAdjacencies( graph );
	let reversed = reverse( normalized );

	t.is( size( reversed ), size( normalized ),
		`reversed should have the same size as normalized.` );

	t.true( has( reversed, "Hello" ),
		`The entry "Hello" should be in reversed.` );

	t.is( reversed[ "Hello" ].length, 0,
		`Entry "Hello" should point to a size-0 set.` );
});



test( `a graph of 1 vertex should be the same after being reversed`, t => {
	let graph = {
		"All Alone :(": [],
	};

	let reversed = reverse( graph );

	t.is( size( graph ), size( reversed ),
		`A normalized graph and its reverse should be the same size.` );

	t.true( has( reversed,  "All Alone :(" ),
		`The reversed graph should have an entry for "All Alone :("` );

	t.is( reversed[ "All Alone :(" ].length, 0,
		`The reversed graph should have an empty set as the value of the entry for "All Alone :("` );
});



test( `the same graph in different valid topological orders should produce the same vertex progress values`, t => {
	let graphA = {
		"Start": [ "Decide", "OhOkay" ],
		"Decide": [ "DoOneThing", "StillNo" ],
		"DoOneThing": [ "DoAnother" ],
		"OhOkay": [ "StillNo" ],
		"DoAnother": [ "WellThatWasFun" ],
		"StillNo": [ "WellThatWasFun" ],
		"WellThatWasFun": [ "Bye" ],
	};

	// Differs by the order of next vertices from "Start" and "Decide".
	let graphB = {
		"Start": [ "OhOkay", "Decide" ],
		"Decide": [ "StillNo", "DoOneThing" ],
		"OhOkay": [ "StillNo" ],
		"DoOneThing": [ "DoAnother" ],
		"DoAnother": [ "WellThatWasFun" ],
		"StillNo": [ "WellThatWasFun" ],
		"WellThatWasFun": [ "Bye" ],
	};

	let progressesA = dagProgress( graphA );
	let progressesB = dagProgress( graphB );

	t.plan( Object.keys( progressesA ).length );

	eachProp( progressesA, ( progress, nodeId ) => {
		t.true( progress.rawValue === progressesB[ nodeId ].rawValue );
	});
});



test( `graph should produce same result as hand calculated result`, t => {
	let graph = {
		"Start": [ "Decide", "OhOkay" ],
		"Decide": [ "DoOneThing", "StillNo" ],
		"DoOneThing": [ "DoAnother" ],
		"OhOkay": [ "StillNo" ],
		"DoAnother": [ "WellThatWasFun" ],
		"StillNo": [ "WellThatWasFun" ],
		"WellThatWasFun": [ "Bye" ],
	};

	let progresses = dagProgress( graph );

	let progressOf = ( running, total ) => ({
		own: 1 / total,
		value: running / total,
		before: (running - 1) / total,
		remaining: (total - running) / total,
		rawOwn: 1,
		rawValue: running,
		rawBefore: running - 1,
		rawRemaining: total - running,
		pathTotal: total,
	});

	let expectedProgresses = {
		"Start": progressOf( 1, 6 ),
		"Decide": progressOf( 2, 6 ),
		"OhOkay": progressOf( 2, 5 ),
		"DoOneThing": progressOf( 3, 6 ),
		"DoAnother": progressOf( 4, 6 ),
		"StillNo": progressOf( 3, 5 ),
		"WellThatWasFun": progressOf( 5, 6 ),
		"Bye": progressOf( 6, 6 ),
	};

	t.plan( Object.keys( expectedProgresses ).length );

	eachProp( expectedProgresses, ( p, v ) => {
		t.deepEqual( p, progresses[ v ],
			`Vertex "${ v }" should have progress ${ p.rawValue }/${ p.pathTotal }. (${ p.value.toFixed( 2 ) })` );
	});
});



test( `longestBefore, longestAfter, and own should, when calculated together, yield a fraction of the same value`, t => {
	let graph = {
		"Start": [ "Decide", "OhOkay" ],
		"Decide": [ "DoOneThing", "StillNo" ],
		"DoOneThing": [ "DoAnother" ],
		"OhOkay": [ "StillNo" ],
		"DoAnother": [ "WellThatWasFun" ],
		"StillNo": [ "WellThatWasFun" ],
		"WellThatWasFun": [ "Bye" ],
	};

	let progresses = dagProgress( graph );

	let progressOf = ( running, total ) => ({
		own: 1 / total,
		value: running / total,
		before: (running - 1) / total,
		remaining: (total - running) / total,
		rawOwn: 1,
		rawValue: running,
		rawBefore: running - 1,
		rawRemaining: total - running,
		pathTotal: total,
	});

	let expectedProgresses = {
		"Start": progressOf( 1, 6 ),
		"Decide": progressOf( 2, 6 ),
		"OhOkay": progressOf( 2, 5 ),
		"DoOneThing": progressOf( 3, 6 ),
		"DoAnother": progressOf( 4, 6 ),
		"StillNo": progressOf( 3, 5 ),
		"WellThatWasFun": progressOf( 5, 6 ),
		"Bye": progressOf( 6, 6 ),
	};

	t.plan( Object.keys( progresses ).length );

	eachProp( progresses, ( p, v ) => {
		let { rawValue, rawRemaining } = p;
		let { rawValue: rawValueCalced, rawRemaining: rawRemainingCalced } = expectedProgresses[ v ];

		let isEqual = (
			rawValue === rawValueCalced
			&& rawRemaining === rawRemainingCalced
		);

		t.true( isEqual,
			`Vertex "${ v }" calculated fraction ${ rawValueCalced }/${ rawRemainingCalced } should equal algorithm-generated fraction ${ rawValue }/${ rawRemaining }.` );
	});
});



test( `graph with no-progress vertices at end should have progress values of 1 for all such vertices`, t => {
	let graph = {
		"Start": [ "Middle 1", "Middle 2" ],
		"Middle 1": [ "Middle 3" ],
		"Middle 2": [ "Middle 3" ],
		"Middle 3": [ "End 1" ],
		"End 1": [ "End 2" ],
	};

	let options = {
		"End 1": { weight: 0 },
		"End 2": { weight: 0 },
	};

	let progresses = dagProgress( graph, options );

	t.is(
		progresses[ 'End 1' ].value, 1,
		`"End 1" should have a progress value that equals 1.` );

	t.is(
		progresses[ 'End 2' ].value, 1,
		`"End 2" should have a progress value that equals 1.` );
});



test( `graph with no-progress vertices at start should have progress values of 0 for all such vertices`, t => {
	let graph = {
		"Start 1": [ "Start 2" ],
		"Start 2": [ "Middle 1", "Middle 2" ],
		"Middle 1": [ "Middle 3" ],
		"Middle 2": [ "Middle 3" ],
		"Middle 3": [ "End 1" ],
		"End 1": [ "End 2" ],
	};

	let options = {
		"Start 1": { weight: 0 },
		"Start 2": { weight: 0 },
	};

	let progresses = dagProgress( graph, options );

	t.is( progresses[ 'Start 1' ].value, 0,
		`"Start 1" should have a progress value that equals 0.` );

	t.is( progresses[ 'Start 2' ].value, 0,
		`"Start 2" should have a progress value that equals 0.` );
});



test( `test case for issue #2: multiple weight:0 vertices with merging path producing incorrect progress values`, t => {
	let graph = {
		 'PrePreStart': [ 'PreStart' ],
		 'PreStart': [ 'Start' ],
		 'Start': [ 'Branch' ],
		 'Branch': [ 'A', 'B' ],
		 'A': [ 'A to End' ],
		 'B': [ 'End' ],
		 'A to End': [ 'End' ],
	};

	let graphOptions = {
		 'Branch': { weight: 0 },
		 'A': { weight: 0 },
		 'B': { weight: 0 },
		 'A to End': { weight: 0 },
		 'End': { weight: 0 },
	};


	// let graphNormalized = normalizeAdjacencies( graph );
	// let optionsNormalized = normalizedVertexOptions( graph, graphOptions );
	// let order = topologicalOrder( graphNormalized );
	// let orderReversed = topologicalOrder( reverse( graphNormalized ) );
	// let lengthsForward = pathLengths( reverse( graphNormalized ), order, graphOptions );
	// let lengthsReverse = pathLengths( graphNormalized, orderReversed, graphOptions );

	// t.true(
	// 	lengthsForward[ 'PrePreStart' ] === 0,
	// 	`PrePreStart going forward should start at 0 going forward.`
	// 	);

	// t.true(
	// 	lengthsForward[ 'PreStart' ] === 1 &&
	// 	lengthsForward[ 'Start' ] === 2,
	// 	`PreStart and Start should have 1 and 2 respectively going forward.`
	// );

	// t.true(
	// 	lengthsForward[ 'Branch' ] === 3 &&
	// 	lengthsForward[ 'A' ] === 3 &&
	// 	lengthsForward[ 'B' ] === 3 &&
	// 	lengthsForward[ 'A to End' ] === 3 &&
	// 	lengthsForward[ 'End' ] === 3,
	// 	`Every node after Start should have a calculated max path length of 3 going forward.` );

	// t.true(
	// 	lengthsReverse[ 'Branch' ] === 0 &&
	// 	lengthsReverse[ 'A' ] === 0 &&
	// 	lengthsReverse[ 'B' ] === 0 &&
	// 	lengthsReverse[ 'A to End' ] === 0 &&
	// 	lengthsReverse[ 'End' ] === 0,
	// 	`Every node after Start should have a calculated max path length of 0 going reverse.` );

	// t.true(
	// 	lengthsReverse[ 'Start' ] === 0,
	// 	`Start should have a calculated max path length of 1 going reverse.`
	// 	);


	let progresses = dagProgress( graph, graphOptions );

	t.is( progresses[ 'PrePreStart' ].rawValue, 1,
		`PrePreStart should have a raw value of 1.` );

	t.is( progresses[ 'PrePreStart' ].pathTotal, 3,
		`PrePreStart should have a pathTotal of 3.` );

	t.is( progresses[ 'PreStart' ].rawValue, 2,
		`PreStart should have a raw value of 2.` );

	t.is( progresses[ 'PreStart' ].pathTotal, 3,
		`PreStart should have a pathTotal of 3.` );

	t.is( progresses[ 'Start' ].value, 1,
		`Start should have a progress of 1 as the rest after it have the option 'weight: 0'.` );

	t.is( progresses[ 'A' ].remaining, 0,
		`'A' should have no progressing vertices after itself.` );

	t.is( progresses[ 'B' ].remaining, 0,
		`'B' should have no progressing vertices after itself.` );

	t.is( progresses[ 'A to End' ].remaining, 0,
		`'A to End' should have no progressing vertices after itself.` );

	t.is( progresses[ 'End' ].remaining, 0,
		`'End' should have no progressing vertices after itself.` );

	t.is( progresses[ 'A' ].value, 1,
		`'A' should have a progress value of 1.` );

	t.is( progresses[ 'B' ].value, 1,
		`'B' should have a progress value of 1.` );

	t.is( progresses[ 'A to End' ].value, 1,
		`'A to End' should have a progress value of 1.` );

	t.is( progresses[ 'End' ].value, 1,
		`'End' should have a progress value of 1.` );
});
