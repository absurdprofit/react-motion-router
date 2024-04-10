import { ScreenProps } from "../Screen";
import { NavigateOptions, NavigationProps } from "./types";

export class NavigateEvent extends Event {
	readonly routerId: string;
	readonly route: string;
	readonly props: NavigationProps;
	readonly navigationType: NonNullable<NavigateOptions["type"]>;
	readonly signal: AbortSignal;
	readonly result: NavigationResult;

	constructor(
		routerId: string,
		route: string,
		props: NavigationProps,
		type: NavigateOptions["type"],
		signal: AbortSignal,
		result: NavigationResult
	) {
		super('navigate');
		this.routerId = routerId;
		this.route = route;
		this.props = props;
		this.navigationType = type ?? "push";
		this.signal = signal;
		this.result = result;
	}
}

export class BackEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly result: NavigationResult;

	constructor(routerId: string, signal: AbortSignal, result: NavigationResult) {
		super('go-back');
		this.routerId = routerId;
		this.signal = signal;
		this.result = result;
	}
}

export class ForwardEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly result: NavigationResult;

	constructor(routerId: string, signal: AbortSignal, result: NavigationResult) {
		super('go-forward');
		this.routerId = routerId;
		this.signal = signal;
		this.result = result;
	}
}
