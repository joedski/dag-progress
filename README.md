Progress in a Directed Acyclic Graph
=====================================

[![Build Status](https://travis-ci.org/joedski/dag-progress.svg?branch=master)](https://travis-ci.org/joedski/dag-progress)

Given a [Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) (or Acyclic Digraph for short), calculate a Progress value for each vertex in the graph.

I'm using this to display meaningful progress values to a User when they are going through a branching interaction which may allow them to skip over parts or take different courses through that interaction.  Representing the interaction as a directed acyclic graph allows this easily.

The progress calculation is very simple: Given a vertex, the length of the longest path possible from any source to that vertex divided by the length of the longest path possible from any source to any sink which conatains that vertex is the progress value for that vertex.  This definition works surprisingly well given even quite disparate branch lengths in an interaction, and handles no-progress vertices quite well, too.

Note: As you might expect from a directed _acyclic_ graph, this library does not support cycles in your story graph.  To get a meaningful progress value in such cases, you should break any cycles before handing the graph to this code.



Dependencies
------------

- [toposort](https://github.com/marcelklehr/toposort) is used for the one sort operation that occurs.



API
----

### Preface: Types

- `AdjacencyListMap = { [nodeId: string]: Array<string> }` Object which maps a Node Id to a list of Next Node Ids.
- `NodeOptionsMap = { [nodeId: string]: NodeOptions }` Maps a Node Id to options for that Node.
	- `NodeOptions = { ... }` Options for a given Node.  All props here are optional.
		- `weight: number` The weight of this Node, or how much it contributes to the total progress.
			- Default value: `1`
- `ProgressMap = { [nodeId: string]: Progress }` Maps a Node Id to Progress values for that Node.
	- `Progress = { ... }` Progress values for a given Node.
		- `value: number` The progress value, from 0.0 to 1.0, of this Node.
		- `own: number` The progress contribution this node itself makes to the longest/heaviest path which contains it.
		- `before: number` The largest progress before this node of all paths that contain this node.
		- `remaining: number` The remaining progress after this node.
		- `rawValue: number` The raw weight value, from 0.0 to `pathTotal`, of this Node.
		- `rawOwn: number` The raw weight contribution this node itself makes to the longest/heaviest path which contains it.
			- This will equal the `weight` option passed for this node, or the default `1` if no `weight` was specified.
		- `rawBefore: number` The largest weight before this node out of all paths that contain this node.
		- `rawRemaining: number` The remaining weight after this node.
		- `pathTotal: number` The total weight of the heaviest path which contains this node.

### dagProgress( adjacencyList: AdjacencyListMap, nodeOptions?: NodeOptionsMap ) => ProgressMap

Calculates the Progress value of each node in the DAG, as represented by its adjacency list.

- `adjacencyList: AdjacencyListMap` The adjacency map for this DAG.
- `nodeOptions: NodeOptionsMap` The options for each Node, if they have any.  Passing nothing gives all nodes the default options.

#### Example

> Note: Example is in ES6.

```js
// During interaction initialization...

import dagProgress from 'dag-progress';
let storyDag = myThingThatMakesMyStoryIntoAnAdjacencyList( myStory );
let vertexProgresses = dagProgress( storyDag );

// Then, in some display component...

const render = ({ props }) => {
	let stepProgress = vertexProgresses[ props.page.id ];

	return (
		h( 'div', { 'class': 'interaction-progress' }, [
			`Progress: ${ Math.round( stepProgress.value * 100 ) }%`
		])
	);
};
```



Degenerate Cases
----------------

### Single Vertex Paths

A single Vertex will, if does _not_ have `weight: 0`, have the Progress value 1.  If it _does_ have `weight: 0` then it's a NaN which makes you a bad person who should feel bad.
