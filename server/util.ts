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
