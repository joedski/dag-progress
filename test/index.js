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



test( `'increments' vertex option should produce 'partial-progress' entries on the 'increments' property of a progress object`, t => {
	let graph = new Map([
		[ "Hello", new Set([ "Friend" ]) ]
	]);

	let options = new Map([
		[ "Friend", { progress: true, increments: 3 }]
	]);

	let graphProgresses = dagProgress( graph, options );

	let progressHello = graphProgresses.get( 'Hello' );
	let progressFriend = graphProgresses.get( 'Friend' );

	t.is( progressHello.increments.length, 1,
		`entries should have 1 increment by default.` );

	t.true( progressHello.increments[ 0 ].fraction.equals( progressHello.fraction ),
		`fraction of single increment of an entry with default increment count should equal its full-progress fraction.` );

	t.is( progressFriend.increments.length, 3,
		`entries should have the number of increments specified in their options.` );

	t.true( progressFriend.increments[ 2 ].fraction.equals( progressFriend.fraction ),
		`fraction of last of many increments of an entry should equal that entry's full-progress fraction.` );

	t.true( progressFriend.increments[ 0 ].value > progressHello.value,
		`first increment should be greater than the previous vertex's full progress.` );

	let increments = progressFriend.increments;
	t.true( increments[ 0 ].value < increments[ 1 ].value && increments[ 1 ].value < increments[ 2 ].value,
		`increments should be in ascending order from 0 to options.increments.` );

	let incr1 = new Fraction( 1, 2 ).add( 1, 6 );
	t.true( increments[ 0 ].fraction.n == incr1.n && increments[ 0 ].fraction.d == incr1.d,
		`given a two vertex graph where the second has 3 increments, the first increment of that second vertex should equal 4/6.` );

	let incr2 = new Fraction( 1, 2 ).add( 2, 6 );
	t.true( increments[ 1 ].fraction.n == incr2.n && increments[ 1 ].fraction.d == incr2.d,
		`given a two vertex graph where the second has 3 increments, the second increment of that second vertex should equal 5/6.` );
});



test( `'increments' vertex option when specified with 'progress: false' should produce useless/identical 'partial-progress' entries on the 'increments' property of a progress object`, t => {
	let graph = new Map([
		[ "Hello", new Set([ "Friend" ]) ]
	]);

	let options = new Map([
		[ "Friend", { progress: false, increments: 3 }]
	]);

	let graphProgresses = dagProgress( graph, options );

	let progressHello = graphProgresses.get( 'Hello' );
	let progressFriend = graphProgresses.get( 'Friend' );

	t.is( progressHello.increments.length, 1,
		`entries should have 1 increment by default.` );

	t.true( progressHello.increments[ 0 ].fraction.equals( progressHello.fraction ),
		`fraction of single increment of an entry with default increment count should equal its full-progress fraction.` );

	t.is( progressFriend.increments.length, 3,
		`entries should have the number of increments specified in their options.` );

	t.true( progressFriend.increments[ 2 ].fraction.equals( progressFriend.fraction ),
		`fraction of last of many increments of an entry should equal that entry's full-progress fraction.` );

	let increments = progressFriend.increments;
	t.true( increments[ 0 ].value == increments[ 1 ].value && increments[ 1 ].value == increments[ 2 ].value,
		`increments should all have the same value.` );
});



test( `test case for issue #2: multiple progress:false vertices with merging path producing incorrect progress values`, t => {
	let graph = new Map([
		[ 'PrePreStart', new Set([ 'PreStart' ]) ],
		[ 'PreStart', new Set([ 'Start' ]) ],
		[ 'Start', new Set([ 'Branch' ]) ],
		[ 'Branch', new Set([ 'A', 'B' ]) ],
		[ 'A', new Set([ 'A to End' ]) ],
		[ 'B', new Set([ 'End' ]) ],
		[ 'A to End', new Set([ 'End' ]) ],
	]);

	let graphOptions = new Map([
		[ 'Branch', { progress: false }],
		[ 'A', { progress: false }],
		[ 'B', { progress: false }],
		[ 'A to End', { progress: false }],
		[ 'End', { progress: false }],
	]);

	let graphNormalized = dagProgress.normalizeAdjacencies( graph );
	let optionsNormalized = dagProgress.normalizedVertexOptions( graph, graphOptions );
	let order = dagProgress.topologicalOrder( graphNormalized );
	let orderReversed = dagProgress.topologicalOrder( dagProgress.reverse( graphNormalized ) );
	let lengthsForward = dagProgress.pathLengths( dagProgress.reverse( graphNormalized ), order, graphOptions );
	let lengthsReverse = dagProgress.pathLengths( graphNormalized, orderReversed, graphOptions );

	t.true(
		lengthsForward.get( 'PrePreStart' ) === 0,
		`PrePreStart going forward should start at 0 going forward.`
		);

	t.true(
		lengthsForward.get( 'PreStart' ) === 1 &&
		lengthsForward.get( 'Start' ) === 2,
		`PreStart and Start should have 1 and 2 respectively going forward.`
	);

	t.true(
		lengthsForward.get( 'Branch' ) === 3 &&
		lengthsForward.get( 'A' ) === 3 &&
		lengthsForward.get( 'B' ) === 3 &&
		lengthsForward.get( 'A to End' ) === 3 &&
		lengthsForward.get( 'End' ) === 3,
		`Every node after Start should have a calculated max path length of 3 going forward.` );

	t.true(
		lengthsReverse.get( 'Branch' ) === 0 &&
		lengthsReverse.get( 'A' ) === 0 &&
		lengthsReverse.get( 'B' ) === 0 &&
		lengthsReverse.get( 'A to End' ) === 0 &&
		lengthsReverse.get( 'End' ) === 0,
		`Every node after Start should have a calculated max path length of 0 going reverse.` );

	t.true(
		lengthsReverse.get( 'Start' ) === 0,
		`Start should have a calculated max path length of 1 going reverse.`
		);


	let progresses = dagProgress( graph, graphOptions );

	t.is( progresses.get( 'Start' ).value, 1,
		`Start should have a progress of 1 as the rest after it have the option 'progress: false'.` );

	t.is( progresses.get( 'A' ).longestAfter, 0,
		`'A' should have no progressing vertices after itself.` );

	t.is( progresses.get( 'B' ).longestAfter, 0,
		`'B' should have no progressing vertices after itself.` );

	t.is( progresses.get( 'A to End' ).longestAfter, 0,
		`'A to End' should have no progressing vertices after itself.` );

	t.is( progresses.get( 'End' ).longestAfter, 0,
		`'End' should have no progressing vertices after itself.` );
});
