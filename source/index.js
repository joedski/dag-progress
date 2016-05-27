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
	let pathLengthsForward = pathLengths( adjacencies, orderForward, vertexOptions );
	let pathLengthsReversed = pathLengths( adjacenciesReversed, orderReverse, vertexOptions );
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



const pathLengths = dagProgress.pathLengths = function( adjacencies, order, vertexOptions ) {
	// let defaultOptions = { progress: true };
	let defaultOptions = defaultVertexOptions();
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



const vertexProgresses = dagProgress.vertexProgresses = function( pathLengthsForward, pathLengthsReverse, vertexOptions ) {
	let progresses = new Map();
	let defaultOptions = defaultVertexOptions();

	pathLengthsForward.forEach( ( lf, v ) => {
		let lr = pathLengthsReverse.get( v ) || 0;
		let options = vertexOptions.get( v ) || defaultOptions;
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

		let numeratorFull = lf;
		let numeratorEmpty = lf - ownProgress;
		let denominator = lf + lr - ownProgress;

		let fraction = new Fraction( numeratorFull, denominator );

		let increments = [];

		for( let incrI = 0, incrMax = options.increments; incrI < incrMax; ++incrI ) {
			let incrementFractionBase = new Fraction( numeratorEmpty, denominator );
			let incrementFractionPartial = new Fraction( (incrI + 1) * ownProgress, denominator * options.increments );
			let incrementFractionPartialSum = incrementFractionBase.add( incrementFractionPartial );
			increments[ incrI ] = {
				fraction: incrementFractionPartialSum,
				value: Number( incrementFractionPartialSum ),
				longestAfter: lr - ownProgress,
				longestBefore: lf - ownProgress,
				own: ownProgress,
				increment: incrI + 1,
				incrementCount: options.increments
			};
		}

		let progress = {
			fraction: fraction,
			value: Number( fraction ),
			increments,
			// This allows doing things like calculating partial-graph progress.
			longestAfter: lr - ownProgress,
			longestBefore: lf - ownProgress,
			own: ownProgress
		};

		progresses.set( v, progress );
	});

	return progresses;
};
