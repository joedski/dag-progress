
const Fraction = require( 'fraction.js' );
const toposort = require( 'toposort' );

module.exports = function dagProgress( adjacencies, vertexOptions ) {
	vertexOptions = normalizedVertexOptions( adjacencies, vertexOptions );

	let adjacenciesReversed = reverse( adjacencies );
	let orderForward = topologicalOrder( adjacencies );
	// let orderReverse = topologicalOrder( adjacenciesReversed );
	let orderReverse = orderForward.slice();
	orderReverse.reverse();
	let pathLengthsForward = pathLengths( adjacencies, orderForward, vertexOptions );
	let pathLengthsReversed = pathLengths( adjacenciesReversed, orderReverse, vertexOptions );
	let progresses = vertexProgresses( pathLengthsForward, pathLengthsReversed );

	return progresses;
};



const normalizedVertexOptions = exports.normalizedVertexOptions = function( adjacencies, vertexOptions ) {
	let defaultVertexOptions = () => ({ progress: true });

	if( vertexOptions == null ) {
		vertexOptions = new Map();
	}
	else {
		vertexOptions = new Map( vertexOptions );
	}

	adjacencies.forEach( ( adjs, va ) => {
		if( vertexOptions.has( va ) === false ) {
			vertexOptions.set( va, defaultVertexOptions() );
		}

		adjs.forEach( vb => {
			if( vertexOptions.has( vb ) === false ) {
				vertexOptions.set( vb, defaultVertexOptions() );
			}
		});
	});

	return vertexOptions;
};



const reverse = exports.reverse = function( adjacencies ) {
	let adjacenciesReversed = new Map();

	adjacencies.forEach( ( adjs, va ) => {
		adjs.forEach( vb => {
			let adjsRev = adjacenciesReversed.get( vb );

			if( adjsRev == null ) {
				adjsRev = new Set();
				adjacenciesReversed.set( vb, adjsRev );
			}

			adjsRev.add( va );
		});
	});

	return adjacenciesReversed;
};



const topologicalOrder = exports.topologicalOrder = function( adjacencies ) {
	let adjsArray = [];

	adjacencies.forEach( adjs => {
		adjsArray.push([ ...adjs ]);
	});

	return toposort( adjsArray );
};



const pathLengths = exports.pathLengths = function( adjacencies, order, vertexOptions ) {
	let lengths = new Map();

	let length = ( v ) => {
		// Potential optimization: If we find the sources first, we can preemptively assign them values based on their progress option.
		if( lengths.has( v ) === false ) {
			let initial;

			if( vertexOptions.get( v ).progress === false ) {
				initial = 0;
			}
			else {
				initial = 1;
			}

			lengths.set( v, initial );
			return initial;
		}

		return lengths.get( v );
	}

	order.forEach( v => {
		let currentValue = length( v );

		adjacencies.get( v ).forEach( nv => {
			let currentNextValue = length( nv );
			let newNextValue;
			let nextOptions = vertexOptions.get( nv );

			if( nextOptions.progress === false ) {
				newNextValue = currentValue;
			}
			else {
				newNextValue = currentValue + 1;
			}

			if( newNextValue > currentNextValue ) {
				lengths.set( nv, newNextValue );
			}
		});
	});

	return lengths;
};



const progresses = exports.progresses = function( pathLengthsForward, pathLengthsReverse ) {
	let progresses = new Map();

	pathLengthsForward.forEach( ( lf, v ) => {
		let lr = pathLengthsReverse.get( v );
		let progress = {
			fraction: (new Fraction( lf )).div( lf + lr )
		};

		progress.value = Number( progress.fraction );

		progresses.set( v, progress );
	});

	return progresses;
};
