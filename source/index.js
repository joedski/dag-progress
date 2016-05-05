// @flow

const Fraction = require( 'fraction.js' );
const toposort = require( 'toposort' );

type VertexOptions = {
	progress?: boolean
};

type Progress = {
	value: number,
	fraction: Fraction
};

// Bluh.
type Vertex = any;

module.exports = function dagProgress(
	adjacencies :Map<Vertex, Set<Vertex>>,
	vertexOptions :Map<Vertex, VertexOptions>
) :Map<Vertex, Progress> {
	vertexOptions = normalizedVertexOptions( adjacencies, vertexOptions );

	let adjacenciesReversed = reverse( adjacencies );
	let orderForward = topologicalOrder( adjacencies );
	let orderReverse = topologicalOrder( adjacenciesReversed );
	// let orderReverse = orderForward.slice();
	// orderReverse.reverse();
	let pathLengthsForward = pathLengths( adjacencies, orderForward, vertexOptions );
	let pathLengthsReversed = pathLengths( adjacenciesReversed, orderReverse, vertexOptions );
	let progresses = vertexProgresses( pathLengthsForward, pathLengthsReversed, vertexOptions );

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



const topologicalOrder = exports.topologicalOrder = function( adjacencies ) :Array<any> {
	let adjsArray = [];

	adjacencies.forEach( ( adjs, va ) => {
		// adjsArray.push([ v, Array.from( adjs ) ]);
		adjs.forEach( ( vb ) => {
			adjsArray.push([ va, vb ]);
		});
	});

	return toposort( adjsArray );
};



const pathLengths = exports.pathLengths = function( adjacencies, order, vertexOptions ) {
	let defaultOptions = { progress: true };
	let lengths = new Map();

	let length = ( v ) => {
		// Potential optimization: If we find the sources first, we can preemptively assign them values based on their progress option.
		if( lengths.has( v ) === false ) {
			let initial;
			let options = vertexOptions.get( v ) || defaultOptions;

			if( options.progress === false ) {
				initial = 0;
			}
			else {
				initial = 1;
			}

			lengths.set( v, initial );
			return initial;
		}

		// (|| 1) from flow.
		return lengths.get( v ) || 1;
	}

	order.forEach( v => {
		let currentValue = length( v );
		let nextVertices = adjacencies.get( v );

		// Flow stuff.  Shouldn't really be needed.
		if( nextVertices == null ) return;

		nextVertices.forEach( nv => {
			let currentNextValue = length( nv );
			let newNextValue;
			let nextOptions = vertexOptions.get( nv ) || defaultOptions;

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



const vertexProgresses = exports.vertexProgresses = function( pathLengthsForward, pathLengthsReverse, vertexOptions ) {
	let progresses = new Map();

	pathLengthsForward.forEach( ( lf, v ) => {
		let lr = pathLengthsReverse.get( v ) || 0;
		let options = vertexOptions.get( v ) || { progress: true };
		let ownProgress;

		// This is to make up for double-counting the current vertex.
		// If it doesn't contribute to progress, then it's still double counted,
		// it's just that 2 * 0 is 0.
		if( options.progress !== false ) {
			ownProgress = 1;
		}
		else {
			ownProgress = 0;
		}

		let fraction = (new Fraction( lf )).div( lf + lr - ownProgress );

		let progress = {
			fraction: fraction,
			value: Number( fraction ),
			// This allows doing things like calculating partial-graph progress.
			longestAfter: lf - ownProgress,
			longestBefore: lr - ownProgress,
			own: ownProgress
		};

		progresses.set( v, progress );
	});

	return progresses;
};
