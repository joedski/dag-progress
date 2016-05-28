// @flow

const Fraction = require( 'fraction.js' );
const toposort = require( 'toposort' );

const defaultVertexOptions = () => ({
	progress: true,
	increments: 1
});

type VertexOptions = {
	progress?: boolean,
	increments?: number
};

type Progress = {
	value: number,
	fraction: Fraction
};

// Bluh.
type Vertex = any;

const dagProgress = module.exports = function dagProgress(
	adjacencies :Map<Vertex, Set<Vertex>>,
	vertexOptions :Map<Vertex, VertexOptions>
) :Map<Vertex, Progress> {
	adjacencies = normalizeAdjacencies( adjacencies );
	vertexOptions = normalizedVertexOptions( adjacencies, vertexOptions );

	let adjacenciesReversed = reverse( adjacencies );
	let orderForward = topologicalOrder( adjacencies );
	let orderReverse = topologicalOrder( adjacenciesReversed );
	// let orderReverse = orderForward.slice();
	// orderReverse.reverse();
	// let pathLengthsForward = pathLengths( adjacencies, orderForward, vertexOptions );
	// let pathLengthsReversed = pathLengths( adjacenciesReversed, orderReverse, vertexOptions );
	let pathLengthsForward = pathLengths( adjacenciesReversed, orderForward, vertexOptions );
	let pathLengthsReversed = pathLengths( adjacencies, orderReverse, vertexOptions );
	let progresses = vertexProgresses( pathLengthsForward, pathLengthsReversed, vertexOptions );

	return progresses;
};



const normalizedVertexOptions = dagProgress.normalizedVertexOptions = function( adjacencies, vertexOptions ) {
	// let defaultVertexOptions = () => ({ progress: true, increments: 1 });

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



const normalizeAdjacencies = dagProgress.normalizeAdjacencies = function( adjacencies ) {
	let normedAdjs = new Map( adjacencies );

	// Basically all we're doing is adding sinks as vertices with explicitly no next-edges.
	// TODO: This may enable some optimizations in other parts.
	adjacencies.forEach( ( adjs, va ) => {
		adjs.forEach( vb => {
			if( normedAdjs.has( vb ) === false ) {
				normedAdjs.set( vb, new Set() );
			}
		});
	});

	return normedAdjs;
};



const reverse = dagProgress.reverse = function( adjacencies ) {
	let adjacenciesReversed = new Map();

	let getAdjsRev = ( v ) => {
		let adjsRev = adjacenciesReversed.get( v );

		if( adjsRev == null ) {
			adjsRev = new Set();
			adjacenciesReversed.set( v, adjsRev );
		}

		return adjsRev;
	}

	adjacencies.forEach( ( adjs, va ) => {
		let adjsRevA = getAdjsRev( va );

		adjs.forEach( vb => {
			let adjsRevB = getAdjsRev( vb );

			adjsRevB.add( va );
		});
	});

	return adjacenciesReversed;
};



const topologicalOrder = dagProgress.topologicalOrder = function( adjacencies ) :Array<any> {
	if( adjacencies.size === 0 ) {
		return [];
	}

	// toposort doesn't handle graphs with no edges (acyc graphs of one vertex)
	if( adjacencies.size === 1 ) {
		let topoOrder = [];

		adjacencies.forEach( ( adjs, v ) => {
			topoOrder[ 0 ] = v;
		});

		return topoOrder;
	}

	let adjsArray = [];

	adjacencies.forEach( ( adjs, va ) => {
		// adjsArray.push([ v, Array.from( adjs ) ]);
		adjs.forEach( ( vb ) => {
			adjsArray.push([ va, vb ]);
		});
	});

	return toposort( adjsArray );
};



const pathLengths = dagProgress.pathLengths = function( adjacenciesReversed, order, vertexOptions ) {
	let defaultOptions = defaultVertexOptions();
	let lengths = new Map();

	let length = ( v ) => {
		let lengthValue;

		if( lengths.has( v ) === false ) {
			lengthValue = 0;
			lengths.set( v, lengthValue );
		}
		else {
			lengthValue = lengths.get( v ) || 0;
		}

		return lengthValue;
	};

	order.forEach( cv => {
		let previousVertices = adjacenciesReversed.get( cv ) || new Set();
		// let currentOptions = vertexOptions.get( cv ) || defaultOptions;

		if( previousVertices.size === 0 ) {
			lengths.set( cv, 0 );
		}

		previousVertices.forEach( pv => {
			let currentLength = length( cv );
			let newCurrentLength = length( pv );
			let previousOptions = vertexOptions.get( pv ) || defaultOptions;

			if( previousOptions.progress ) {
				newCurrentLength = newCurrentLength + 1;
			}

			if( newCurrentLength > currentLength ) {
				lengths.set( cv, newCurrentLength );
			}
		})
	});

	return lengths;
};



const vertexProgresses = dagProgress.vertexProgresses = function( pathLengthsForward, pathLengthsReverse, vertexOptions ) {
	let progresses = new Map();
	let defaultOptions = defaultVertexOptions();

	pathLengthsForward.forEach( ( longestBefore, v ) => {
		let longestAfter = pathLengthsReverse.get( v ) || 0;
		let options = vertexOptions.get( v ) || defaultOptions;
		let ownProgress;

		let progressObject = ( fraction ) => ({
			fraction,
			value: Number( fraction ),
			longestBefore,
			longestAfter,
			own: ownProgress,
		});

		if( options.progress === true ) {
			ownProgress = 1;
		}
		else {
			ownProgress = 0;
		}

		let numeratorFull = longestBefore + ownProgress;
		let numeratorEmpty = longestBefore;
		let denominator = longestBefore + longestAfter + ownProgress;

		let fraction = new Fraction( numeratorFull, denominator );
		let increments = [];

		for( let incrI = 0, incrMax = options.increments; incrI < incrMax; ++incrI ) {
			let incrementFractionBase = new Fraction( numeratorEmpty, denominator );
			let incrementFractionPartial = new Fraction( (incrI + 1), denominator * incrMax )
				.mul( ownProgress )
				;
			let incrementFractionSum = incrementFractionBase.add( incrementFractionPartial );

			increments[ incrI ] = progressObject( incrementFractionSum );
			increments[ incrI ].increment = incrI + 1;
			increments[ incrI ].incrementCount = incrMax;
		}

		let progress = progressObject( fraction );
		progress.increments = increments;

		progresses.set( v, progress );
	});

	return progresses;
};
