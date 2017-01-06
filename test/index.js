import test from 'ava';
import { eachProp, has } from '../source/utils';
import dagProgress, {
	normalizeAdjacencies,
	reverse,
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



test.skip( `'increments' vertex option should produce 'partial-progress' entries on the 'increments' property of a progress object`, t => {
	let graph = new Map([
		[ "Hello", new Set([ "Friend" ]) ]
	]);

	let options = new Map([
		[ "Friend", { progress: true, increments: 3 }]
	]);

	let graphProgresses = dagProgress( graph, options );

	let progressHello = graphProgresses.get( 'Hello' );
	let progressFriend = graphProgresses.get( 'Friend' );

	// t.is( progressHello.increments.length, 1,
	// 	`entries should have 1 increment by default.` );

	// t.true( progressHello.increments[ 0 ].fraction.equals( progressHello.fraction ),
	// 	`fraction of single increment of an entry with default increment count should equal its full-progress fraction.` );

	// t.is( progressFriend.increments.length, 3,
	// 	`entries should have the number of increments specified in their options.` );

	// t.true( progressFriend.increments[ 2 ].fraction.equals( progressFriend.fraction ),
	// 	`fraction of last of many increments of an entry should equal that entry's full-progress fraction.` );

	// t.true( progressFriend.increments[ 0 ].value > progressHello.value,
	// 	`first increment should be greater than the previous vertex's full progress.` );

	// let increments = progressFriend.increments;
	// t.true( increments[ 0 ].value < increments[ 1 ].value && increments[ 1 ].value < increments[ 2 ].value,
	// 	`increments should be in ascending order from 0 to options.increments.` );

	// let incr1 = new Fraction( 1, 2 ).add( 1, 6 );
	// t.true( increments[ 0 ].fraction.n == incr1.n && increments[ 0 ].fraction.d == incr1.d,
	// 	`given a two vertex graph where the second has 3 increments, the first increment of that second vertex should equal 4/6.` );

	// let incr2 = new Fraction( 1, 2 ).add( 2, 6 );
	// t.true( increments[ 1 ].fraction.n == incr2.n && increments[ 1 ].fraction.d == incr2.d,
	// 	`given a two vertex graph where the second has 3 increments, the second increment of that second vertex should equal 5/6.` );
});

