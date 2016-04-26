Progress in a Directed Acyclic Graph
=====================================

Given a [Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) (or Acyclic Digraph for short), calculate a Progress value for each vertex in the graph.

I'm using this to display meaningful progress values to a User when they are going through a branching interaction which may allow them to skip over parts or take different courses through that interaction.  Representing the interaction as a directed acyclic graph allows this easily.



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
			`Progress: ${ Math.round( stepProgress.progress * 100 ) }%`
		])
	);
};
```


Algorithm
---------

Progress calculation is very simple: `P = B / (B + A)` where...
- `P` is the Progress Value of a given Vertex
- `B` is the greatest Path length from any Source to the given Vertex
- `A` is the greatest Path length from the given Vertex to any Sink

Calculating such greatest path lengths in a digraph is a linear time operation, similar to calculating the number of different paths.

To find the greatest path length from any Source to a given Vertex:
1. Let the Value of any Vertex without a defined Value be 0.  This value represents the Greatest Path Length from Any Source to a given Vertex.
2. For each Vertex in Topological Order:
	1. For each Next Vertex the Current Vertex connects to:
		1. If the Next Vertex has `progress: true`, then its Next Value is the Current Vertex's Value + 1.
			1. Otherwise, the Next Value is the Current Vertex's Value.
		2. If the Next Vertex's own Value is less than the Next Value, assign the Next Value as that Next Vertex's Own Value.

To find the greatest path length from any Vertex to any Sink, simply reverse the Graph and apply the same process, and the Value will represent the greatest path length from a given Vertex to any Sink.

Progress is then calculated as stated above.
