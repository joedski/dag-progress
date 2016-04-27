'use strict';

var Fraction = require('fraction.js');
var toposort = require('toposort');

// Bluh.


module.exports = function dagProgress(adjacencies, vertexOptions) {
	vertexOptions = normalizedVertexOptions(adjacencies, vertexOptions);

	var adjacenciesReversed = reverse(adjacencies);
	var orderForward = topologicalOrder(adjacencies);
	// let orderReverse = topologicalOrder( adjacenciesReversed );
	var orderReverse = orderForward.slice();
	orderReverse.reverse();
	var pathLengthsForward = pathLengths(adjacencies, orderForward, vertexOptions);
	var pathLengthsReversed = pathLengths(adjacenciesReversed, orderReverse, vertexOptions);
	var progresses = vertexProgresses(pathLengthsForward, pathLengthsReversed);

	return progresses;
};

var normalizedVertexOptions = exports.normalizedVertexOptions = function (adjacencies, vertexOptions) {
	var defaultVertexOptions = function defaultVertexOptions() {
		return { progress: true };
	};

	if (vertexOptions == null) {
		vertexOptions = new Map();
	} else {
		vertexOptions = new Map(vertexOptions);
	}

	adjacencies.forEach(function (adjs, va) {
		if (vertexOptions.has(va) === false) {
			vertexOptions.set(va, defaultVertexOptions());
		}

		adjs.forEach(function (vb) {
			if (vertexOptions.has(vb) === false) {
				vertexOptions.set(vb, defaultVertexOptions());
			}
		});
	});

	return vertexOptions;
};

var reverse = exports.reverse = function (adjacencies) {
	var adjacenciesReversed = new Map();

	adjacencies.forEach(function (adjs, va) {
		adjs.forEach(function (vb) {
			var adjsRev = adjacenciesReversed.get(vb);

			if (adjsRev == null) {
				adjsRev = new Set();
				adjacenciesReversed.set(vb, adjsRev);
			}

			adjsRev.add(va);
		});
	});

	return adjacenciesReversed;
};

var topologicalOrder = exports.topologicalOrder = function (adjacencies) {
	var adjsArray = [];

	adjacencies.forEach(function (adjs) {
		adjsArray.push(Array.from(adjs));
	});

	return toposort(adjsArray);
};

var pathLengths = exports.pathLengths = function (adjacencies, order, vertexOptions) {
	var defaultOptions = { progress: true };
	var lengths = new Map();

	var length = function length(v) {
		// Potential optimization: If we find the sources first, we can preemptively assign them values based on their progress option.
		if (lengths.has(v) === false) {
			var initial = void 0;
			var options = vertexOptions.get(v) || defaultOptions;

			if (options.progress === false) {
				initial = 0;
			} else {
				initial = 1;
			}

			lengths.set(v, initial);
			return initial;
		}

		// (|| 1) from flow.
		return lengths.get(v) || 1;
	};

	order.forEach(function (v) {
		var currentValue = length(v);
		var nextVertices = adjacencies.get(v);

		// Flow stuff.  Shouldn't really be needed.
		if (nextVertices == null) return;

		nextVertices.forEach(function (nv) {
			var currentNextValue = length(nv);
			var newNextValue = void 0;
			var nextOptions = vertexOptions.get(nv) || defaultOptions;

			if (nextOptions.progress === false) {
				newNextValue = currentValue;
			} else {
				newNextValue = currentValue + 1;
			}

			if (newNextValue > currentNextValue) {
				lengths.set(nv, newNextValue);
			}
		});
	});

	return lengths;
};

var vertexProgresses = exports.vertexProgresses = function (pathLengthsForward, pathLengthsReverse) {
	var progresses = new Map();

	pathLengthsForward.forEach(function (lf, v) {
		var lr = pathLengthsReverse.get(v);
		var progress = {
			fraction: new Fraction(lf).div(lf + lr),
			value: 0
		};

		progress.value = Number(progress.fraction);

		progresses.set(v, progress);
	});

	return progresses;
};