import { PlainObject } from "@react-motion-router/core";
import { ScreenProps } from "../Screen";
import { NavigateOptions, NavigationProps } from "./types";

export class NavigateEvent<Params extends PlainObject = {}, Config extends ScreenProps["config"] = {}> extends Event {
	readonly routerId: string;
	readonly route: string;
	readonly props: NavigationProps;
	readonly navigationType: NonNullable<NavigateOptions["type"]>;
	readonly signal: AbortSignal;
	readonly finished: Promise<void>;

	constructor(routerId: string, route: string, props: NavigationProps, type: NavigateOptions["type"], signal: AbortSignal, finished: Promise<void>) {
		super('navigate');
		this.routerId = routerId;
		this.route = route;
		this.props = props;
		this.navigationType = type ?? "push";
		this.signal = signal;
		this.finished = finished;
	}
}

export class BackEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly finished: Promise<void>;

	constructor(routerId: string, signal: AbortSignal, finished: Promise<void>) {
		super('go-back');
		this.routerId = routerId;
		this.signal = signal;
		this.finished = finished;
	}
}

export class ForwardEvent extends Event {
	readonly routerId: string;
	readonly signal: AbortSignal;
	readonly finished: Promise<void>;

	constructor(routerId: string, signal: AbortSignal, finished: Promise<void>) {
		super('go-forward');
		this.routerId = routerId;
		this.signal = signal;
		this.finished = finished;
	}
}
