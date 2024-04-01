export class HistoryEntry {
	readonly routerId: string;
	readonly source: NavigationHistoryEntry;
	readonly index: number;

	constructor(source: NavigationHistoryEntry, routerId: string, index: number) {
		this.source = source;
		this.routerId = routerId;
		this.index = index;
	}

	get globalIndex() {
		return this.source.index;
	}

	get url() {
		if (!this.source.url) return null;
		return new URL(this.source.url);
	}

	get key() {
		return this.source.key;
	}

	getState<T>() {
		return this.source.getState() as T;
	}
}