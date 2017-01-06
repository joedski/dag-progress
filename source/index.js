// @flow

import toposort from 'toposort';

import {
	has,
	eachProp,
} from './utils';



/**
 * Types
 */

/**
 * The options a Node may have.
 * @type {Object}
 */
export type NodeOptions = {
	// The weight of any edge going to this node.
	weight?: number,
};

/**
 * All the options a Node must have after normalization.
 * @type {Object}
 */
export type NodeOptionsRequired = {
	weight: number,
};

/**
 * The resultant Progress object created for each node.
 * Usually all you will need is the `progress` property, but
 * in some exotic cases you may wish or need to use the others.
 * @type {Object}
 */
export type Progress = {
	// Progress value of reaching this node.
	// Usually this is all you need.
	value: number,
	// Progress value of any node previous to this node.
	before: number,
	// Weight of this node.
	own: number,
	// Progress remaining after this node.
	remaining: number,
	// Raw values if for some reason you need to work with them.
	// Unnormalized weight total to reach this node.
	rawValue: number,
	// Unnormalized weight total to reach any node before this one.
	rawBefore: number,
	// Unnormalized weight contribution of this node.
	// Equal to the weight passed in, or 1 by default.
	rawOwn: number,
	// Unnormalized weight total left before completion.
	rawRemaining: number,
	// Total weight of the heaviest path that this node is a part of.
	pathTotal: number,
};

/**
 * An adjacency map of node ids to a list of next-ids.
 * Arrays are assumed to be unsorted.
 * @type {Object}
 */
export type AdjacencyListMap = {
	[nodeId: string]: Array<string>,
};

/**
 * Map of node ids to NodeOptions.
 * @type {Object}
 */
export type NodeOptionsMap = {
	[nodeId: string]: NodeOptions,
};

export type NodeOptionsMapRequired = {
	[nodeId: string]: NodeOptionsRequired,
};

export type ProgressMap = {
	[nodeId: string]: Progress,
};

export type PathWeightMap = {
	[nodeId: string]: number,
};



const DEFAULT_WEIGHT = 1;



export default function dagProgress(
	adjacencies: AdjacencyListMap,
	nodeOptionsMap?: NodeOptionsMap = {},
): ProgressMap {
	const normedNodeOptionsMap = normalizeNodeOptionsMap( adjacencies, nodeOptionsMap );
	const adjacenciesReversed = reverse( adjacencies );
	const orderForward = topologicalOrder( adjacencies );
	const orderReversed = topologicalOrder( adjacenciesReversed );

	const pathWeightsForward = pathWeights( adjacencies, orderForward, normedNodeOptionsMap );
	const pathWeightsReversed = pathWeights( adjacenciesReversed, orderReversed, normedNodeOptionsMap );

	return nodeProgresses( pathWeightsForward, pathWeightsReversed, normedNodeOptionsMap );
}

const getDefaultNodeOptions = (weight = DEFAULT_WEIGHT) => ({
	weight,
});

export function normalizeNodeOptionsMap(
	adjacencies: AdjacencyMap,
	nodeOptionsMap: NodeOptionsMap,
): NodeOptionsMapRequired {
	const normedNodeOptionsMap: NodeOptionsMapRequired = {};
	const startNodes = Object.keys( adjacencies );

	function setNodeOptions( nodeId ) {
		if( has( normedNodeOptionsMap, nodeId ) ) {
			return;
		}

		if( ! has( nodeOptionsMap, nodeId ) ) {
			normedNodeOptionsMap[ nodeId ] = getDefaultNodeOptions();
		}
		else {
			normedNodeOptionsMap[ nodeId ] = {
				...getDefaultNodeOptions(),
				...nodeOptionsMap[ nodeId ],
			};
		}
	}

	startNodes.forEach(( startNodeId ) => {
		setNodeOptions( startNodeId );
		// ensure options are defined even for drain nodes. (nodes with no outgoing edges.)
		adjacencies[ startNodeId ].forEach( setNodeOptions );
	});

	return normedNodeOptionsMap;
}

export function reverse( adjacencies: AdjacencyMap ): AdjacencyMap {
	const adjacenciesReversed: AdjacencyMap = {};

	eachProp( adjacencies, ( nextNodes, startNodeId ) => {
		nextNodes.forEach(( nextNodeId ) => {
			if( ! has( adjacenciesReversed, nextNodeId ) ) {
				adjacenciesReversed[ nextNodeId ] = [];
			}

			const reverseNextNodes = adjacenciesReversed[ nextNodeId ];
			reverseNextNodes.push( startNodeId );
		});
	});

	return adjacenciesReversed;
}

export function topologicalOrder( adjacencies: AdjacencyMap ): Array<string> {
	const edges = [];

	eachProp( adjacencies, ( nextNodes, startNodeId ) => {
		nextNodes.forEach(( nextNodeId ) => {
			edges.push([ startNodeId, nextNodeId ]);
		});
	});

	return toposort( edges );
}

/**
 * Calculates the heaviest possible path weight prior to any node.
 * Such a path weight will not include the node itself, although it will be every node
 * before it in the heaviest path to that node.
 *
 * When used on a reversed graph with a corresponding topological order
 * effectively calculates the heaviest possible remaining weight of the path after each node,
 * not counting that node itself.
 *
 * For a given node, this remaining value, combined with the prior-to value and
 * that node's own weight, is the weight of the heaviest path that contains that node.
 *
 * @param  {AdjacencyMap} adjacencies
 *         The adjacencies of your thing.
 * @param  {Array<string>} order
 *         A valid topological order for the given adjacencies.
 * @param  {NodeOptionsMapRequired} nodeOptionsMap
 *         Normalized options.
 * @return {PathWeightMap} Map of node ids to path-prior weights.
 */
export function pathWeights(
	adjacencies: AdjacencyMap,
	order: Array<string>,
	nodeOptionsMap: NodeOptionsMapRequired,
): PathWeightMap {
	const weights: PathWeightMap = {};

	const weightOf = ( nodeId ) => {
		if( has( weights, nodeId ) ) {
			return weights[ nodeId ];
		}

		weights[ nodeId ] = 0;
		return weights[ nodeId ];
	};

	order.forEach( nodeId => {
		const currentWeight = weightOf( nodeId );
		const currentOptions = nodeOptionsMap[ nodeId ] || getDefaultNodeOptions();
		const nextNodes = adjacencies[ nodeId ];

		if( ! nextNodes ) return;

		nextNodes.forEach( nextNodeId => {
			const currentNextWeight = weightOf( nextNodeId );
			const newNextWeight = currentWeight + currentOptions.weight;

			// Changing this to < calculates the smallest path weights.
			if( newNextWeight > currentNextWeight ) {
				weights[ nextNodeId ] = newNextWeight;
			}
		});
	});

	return weights;
}

export function nodeProgresses(
	pathWeightsForward: PathWeightMap,
	pathWeightsReversed: PathWeightMap,
	nodeOptionsMap: NodeOptionsMapRequired,
): ProgressMap {
	const progresses: ProgressMap = {};

	eachProp( pathWeightsForward, ( weightFore, nodeId ) => {
		const weightRev = pathWeightsReversed[ nodeId ];
		const options = nodeOptionsMap[ nodeId ];
		const ownWeight = options.weight;

		const pathTotal = (weightFore + ownWeight + weightRev);

		progresses[ nodeId ] = {
			value: (weightFore + ownWeight) / pathTotal,
			before: weightFore / pathTotal,
			own: ownWeight / pathTotal,
			remaining: weightRev / pathTotal,
			rawValue: (weightFore + ownWeight),
			rawOwn: ownWeight,
			rawBefore: weightFore,
			rawRemaining: weightRev,
			pathTotal,
		};
	});

	return progresses;
}
