Progress in a Directed Acyclic Graph
=====================================

[![Build Status](https://travis-ci.org/joedski/dag-progress.svg?branch=master)](https://travis-ci.org/joedski/dag-progress)

Given a [Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) (or Acyclic Digraph for short), calculate a Progress value for each vertex in the graph.

I'm using this to display meaningful progress values to a User when they are going through a branching interaction which may allow them to skip over parts or take different courses through that interaction.  Representing the interaction as a directed acyclic graph allows this easily.

The progress calculation is very simple: Given a vertex, the length of the longest path possible from any source to that vertex divided by the length of the longest path possible from any source to any sink which conatains that vertex is the progress value for that vertex.  This definition works surprisingly well given even quite disparate branch lengths in an interaction, and handles no-progress vertices quite well, too.



Dependencies
------------

- [fraction.js](https://www.npmjs.com/package/fraction.js) is used to ensure the rational numbers stay accurate.
- [toposort](https://github.com/marcelklehr/toposort) is used for the one sort operation that occurs.



API
---

### dagProgress( adjacencyList, vertexOptions? )

Type: `( Map<Vertex, Set<Vertex>>, Map<Vertex, VertexOptions> ) => Map<Vertex, Progress>`

Related Types:
- `Vertex: any` Though you should probably stick to `Symbol`s, `string`s, or `number`s.
- `VertexOptions: { progress?: boolean }` Holds various options for a Vertex.
	- `progress?: boolean` Optional flag determining if a Vertex should contribute to the User's Progress or not.  If omitted, assumed to be `true`.
- `Progress: { value: number, fraction: Fraction }`

#### Example

> Note: Example is in ES6.

```js
// During interaction initialization...

import dagProgress from 'dag-progress';
let storyDag = myThingThatMakesMyStoryIntoAnAdjacencyList( myStory );
let vertexProgresses = dagProgress( storyDag );

// Stick those progresses in the our app's state somehere.
// Or just grab it from some global service if that's your style.

let store = createStore( reducer, initState({
	vertexProgresses
}));

// Then, in some display component...

const render = ({ props, context }) => {
	let stepProgress = context.vertexProgresses.get( props.step.id );

	return (
		h.( 'div', { 'class': 'interaction-progress' }, [
			`Progress: ${ Math.round( stepProgress.value * 100 ) }%`
		])
	);
};
```



Degenerate Cases
----------------

### Single Vertex Paths

A single Vertex will, if does not have `progress: false`, have the Progress value 1.  If it does have `progress: false` then it's a undefined, though will probably result in a div-by-0 error, which makes you a bad person who should feel bad.
