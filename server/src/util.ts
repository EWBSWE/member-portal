export function groupBy<K, V>(collection: V[], lambda: (t: V) => K): Map<K, V[]> {
	return collection
		.reduce((group: Map<K, V[]>, current: V): Map<K, V[]> => {
			const key: K = lambda(current)
			if (!group.has(key)) {
				group.set(key, [])
			}
			group.get(key)!
				.push(current)
			return group
		}, new Map<K, V[]>())
}

type Parts<T> = { left: T[], right: T[] }

/**
 * Partition collection into left and right decided by the predicate. If
 * predicate is true, put item in the left bin otherwise the right.
 */
export function partition<T>(collection: T[], predicate: (t: T) => boolean): Parts<T> {
	return collection.reduce((group, item) => {
		if (predicate(item)) {
			group.left.push(item);
		} else {
			group.right.push(item);
		}
		return group;
	}, { left: [], right: [] } as Parts<T>);
}

/**
 * Transform a collection to a map where key is decided by lambda.
 */
export function mapBy<K, V>(collection: V[], lambda: (item: V) => K): Map<K, V> {
	return collection.reduce((group, item) => {
		const key = lambda(item);
		group.set(key, item)
		return group;
	}, new Map<K, V>());
}
