import test from 'ava';
import { eachProp } from '../source/utils';
import dagProgress from '../source';



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
