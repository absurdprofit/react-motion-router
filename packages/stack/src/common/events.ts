import { GestureEvent } from 'web-gesture-events';
import { NavigateOptions, NavigationProps } from './types';

export class NavigateEvent extends Event {
  public readonly routerId: string;
  public readonly route: string;
  public readonly props: NavigationProps;
  public readonly navigationType: NonNullable<NavigateOptions['type']>;
  public readonly signal: AbortSignal;
  public readonly committed: Promise<NavigationHistoryEntry>;
  public readonly transition: NavigationTransition;

  constructor(
    routerId: string,
    route: string,
    props: NavigationProps,
    type: NavigateOptions['type'],
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    super('navigate');
    this.routerId = routerId;
    this.route = route;
    this.props = props;
    this.navigationType = type ?? 'push';
    this.signal = signal;
    this.committed = committed;
    this.transition = transition;
  }
}

export class BackEvent extends Event {
  public readonly routerId: string;
  public readonly signal: AbortSignal;
  public readonly committed: Promise<NavigationHistoryEntry>;
  public readonly transition: NavigationTransition;

  constructor(
    routerId: string,
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    super('back');
    this.routerId = routerId;
    this.signal = signal;
    this.committed = committed;
    this.transition = transition;
  }
}

export class ForwardEvent extends Event {
  public readonly routerId: string;
  public readonly signal: AbortSignal;
  public readonly committed: Promise<NavigationHistoryEntry>;
  public readonly transition: NavigationTransition;

  constructor(
    routerId: string,
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    super('forward');
    this.routerId = routerId;
    this.signal = signal;
    this.committed = committed;
    this.transition = transition;
  }
}

export class GestureStartEvent extends Event {
  public readonly source: GestureEvent;

  constructor(source: GestureEvent) {
    super('gesture-start');
    this.source = source;
  }
}

export class GestureEndEvent extends Event {
  public readonly source: GestureEvent;

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