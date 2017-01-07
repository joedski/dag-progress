// @flow

type ObjectMap<V> = { [key: string]: V };
type ObjectMapIteratee<V, R> = ( value: V, key: string ) => R;
type ObjectEachIteratee<V> = ( value: V, key: string ) => void;

export function mapValues<V, R>(
	obj: ObjectMap<V>,
	fn: ObjectMapIteratee<V, R>
): ObjectMap<R> {
	const keys = Object.keys( obj );
	const result: ObjectMap<R> = {};

	keys.forEach( k => {
		result[ k ] = fn( obj[ k ], k );
	});

	return result;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function has( obj: Object, key: string ): boolean {
	return hasOwnProperty.call( obj, key );
}

export function eachProp<V>( obj: ObjectMap<V>, fn: ObjectEachIteratee<V> ): void {
	Object.keys( obj ).forEach( key => fn( obj[ key ], key ));
}
