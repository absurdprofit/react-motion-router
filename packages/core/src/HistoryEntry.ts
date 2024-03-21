export interface HistoryEntry extends NavigationHistoryEntry {
	readonly routerId: string;
	readonly globalIndex: number;
	readonly route: string;

	getState<T>(): T;
}