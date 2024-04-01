export class HistoryEntry extends NavigationHistoryEntry {
	readonly routerId: string;
	readonly source: NavigationHistoryEntry;
	readonly index: number;

	constructor(source: NavigationHistoryEntry, routerId: string, index: number) {
		super();
		this.source = source;
		this.routerId = routerId;
		this.index = index;
	}

	get globalIndex() {
		return this.source.index;
	}

	getState<T>() {
		return this.source.getState() as T;
	}
}