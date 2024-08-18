import { GestureEvent } from "web-gesture-events";
import { NavigateOptions, NavigationProps } from "./types";

export class NavigateEvent extends Event {
	readonly routerId: string;
	readonly route: string;
	readonly props: NavigationProps;
	readonly navigationType: NonNullable<NavigateOptions["type"]>;
	readonly signal: AbortSignal;
	readonly committed: Promise<NavigationHistoryEntry>;
	readonly transition: NavigationTransition;

	constructor(
		routerId: string,
		route: string,
		props: NavigationProps,
		type: NavigateOptions["type"],
		signal: AbortSignal,
		committed: Promise<NavigationHistoryEntry>,
		transition: NavigationTransition
	) {
		super('navigate');
		this.routerId = routerId;
		this.route = route;
		this.props = props;
		this.navigationType = type ?? "push";
		this.signal = signal;
		this.committed = committed;
		this.transition = transition;
	}
}

export class BackEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly committed: Promise<NavigationHistoryEntry>;
	readonly transition: NavigationTransition;

	constructor(routerId: string, signal: AbortSignal, committed: Promise<NavigationHistoryEntry>, transition: NavigationTransition) {
		super('back');
		this.routerId = routerId;
		this.signal = signal;
		this.committed = committed;
		this.transition = transition;
	}
}

export class ForwardEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly committed: Promise<NavigationHistoryEntry>;
	readonly transition: NavigationTransition;

	constructor(routerId: string, signal: AbortSignal, committed: Promise<NavigationHistoryEntry>, transition: NavigationTransition) {
		super('forward');
		this.routerId = routerId;
		this.signal = signal;
		this.committed = committed;
		this.transition = transition;
	}
}

export class GestureStartEvent extends Event {
	readonly source: GestureEvent;

	constructor(source: GestureEvent) {
		super('gesture-start');
		this.source = source;
	}
}

export class GestureEndEvent extends Event {
	readonly source: GestureEvent;

	constructor(source: GestureEvent) {
		super('gesture-end');
		this.source = source;
	}
}

export class GestureCancelEvent extends Event {
	constructor() {
		super('gesture-cancel');
	}
}