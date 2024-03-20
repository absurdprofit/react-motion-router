export interface HistoryEntry extends NavigationHistoryEntry {
	readonly routerId: string;
	readonly globalIndex: number;

	getState<T>(): T;
}