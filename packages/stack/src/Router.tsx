import {
  AnchorBase,
  FIRST_INDEX,
  LAST_INDEX,
  RouterBase,
  SINGLE_ELEMENT_LENGTH,
  cloneAndInject,
  historyEntryFromDestination,
  matchRoute
} from '@react-motion-router/core';
import {
  ClonedElementType,
  LoadEvent,
  NestedRouterContext,
  RouterBaseConfig,
  RouterBaseProps,
  RouterBaseState,
  ScreenChild,
  PromiseWrapper
} from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen, ScreenConfig } from './Screen';
import {
  HistoryEntryState,
  isHorizontalDirection,
  isRefObject,
  isSupportedDirection,
  ScreenInternalProps,
  SwipeDirection
} from './common/types';
import { createRef, startTransition } from 'react';
import { SwipeStartEvent, SwipeEndEvent } from 'web-gesture-events';
import { GestureTimeline } from 'web-animations-extension';
import {
  deepEquals,
  isGesture,
  isWithinGestureInset
} from './common/utils';
import {
  GestureCancelEvent,
  GestureEndEvent,
  GestureStartEvent
} from './common/events';
import {
  DEFAULT_GESTURE_CONFIG,
  DEFAULT_PLAYBACK_RATE
} from './common/constants';
import { GestureRegion } from './GestureRegion';
import { HistoryEntry } from './HistoryEntry';

export interface RouterConfig extends RouterBaseConfig {
  screenConfig?: ScreenConfig;
  disableBrowserRouting?: boolean;
  initialPathname?: string;
  shouldIntercept?(navigateEvent: NavigateEvent): boolean;
  onIntercept?(navigateEvent: NavigateEvent): void;
}

export interface RouterProps extends RouterBaseProps<Screen> {
  config?: RouterConfig;
}

type InjectedScreenProps = Pick<ScreenProps, 'config' | 'defaultParams'> &
  ScreenInternalProps;
export interface RouterState extends RouterBaseState {
  transition: NavigationTransition | LoadEvent['transition'] | null;
  screenStack: ClonedElementType<ScreenChild<Screen>, InjectedScreenProps>[];
  gestureDirection: SwipeDirection;
  gestureAreaWidth: number;
  gestureMinFlingVelocity: number;
  gestureHysteresis: number;
  gestureDisabled: boolean;
  fromKey: React.Key | null;
  destinationKey: React.Key | null;
  documentTitle?: string;
  controller: AbortController | null;
}

export class Router extends RouterBase<
  RouterProps,
  RouterState
> {
  public readonly navigation;
  #committed: PromiseWrapper<NavigationHistoryEntry> | null = null;

  constructor(
    props: RouterProps,
    context: React.ContextType<typeof NestedRouterContext>
  ) {
    super(props, context);
    this.navigation = new Navigation({
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this),
      dispatchEvent: this.dispatchEvent.bind(this),
      parent: this.parent?.navigation ?? null,
      routerId: this.id,
      baseURL: this.baseURL,
      baseURLPattern: this.baseURLPattern,
      getCommitted: () =>{
        return this.committed;
      },
      getTransition: () => {
        return this.state.transition;
      },
      getPathPatterns: () => {
        return this.pathPatterns;
      },
      getNavigatorById: (id: string) =>
        this.getRouterById(id)?.navigation ?? null,
    });
    const {
      gestureAreaWidth = DEFAULT_GESTURE_CONFIG.gestureAreaWidth,
      gestureDirection = DEFAULT_GESTURE_CONFIG.gestureDirection,
      gestureDisabled = DEFAULT_GESTURE_CONFIG.gestureDisabled,
      gestureHysteresis = DEFAULT_GESTURE_CONFIG.gestureHysteresis,
      gestureMinFlingVelocity = DEFAULT_GESTURE_CONFIG.gestureMinFlingVelocity,
    } = props.config?.screenConfig ?? {};
    
    this.state = {
      screenStack: [],
      gestureDirection,
      gestureAreaWidth,
      gestureHysteresis,
      gestureDisabled,
      gestureMinFlingVelocity,
      transition: null,
      documentTitle: document.title,
      fromKey: null,
      destinationKey: null,
      controller: null,
    };
  }

  public static getDerivedStateFromProps(_: RouterProps, state: RouterState) {
    const config = state.screenStack.find(
      (screen) => (
        isRefObject(screen.props.ref)
        && screen.props.ref.current?.focused
      )
    )?.props.config;
    document.title = config?.title ?? document.title;
    return {
      gestureDirection:
        config?.gestureDirection ?? DEFAULT_GESTURE_CONFIG.gestureDirection,
      gestureAreaWidth:
        config?.gestureAreaWidth ?? DEFAULT_GESTURE_CONFIG.gestureAreaWidth,
      gestureMinFlingVelocity:
        config?.gestureMinFlingVelocity
        ?? DEFAULT_GESTURE_CONFIG.gestureMinFlingVelocity,
      gestureHysteresis:
        config?.gestureHysteresis ?? DEFAULT_GESTURE_CONFIG.gestureHysteresis,
      gestureDisabled:
        config?.gestureDisabled ?? DEFAULT_GESTURE_CONFIG.gestureDisabled,
      documentTitle: config?.title,
    };
  }

  public componentDidMount(): void {
    super.componentDidMount();
    window.navigation.addEventListener('currententrychange', this);
    window.navigation.addEventListener('navigate', this);
    window.navigation.addEventListener('navigatesuccess', this);
    window.navigation.addEventListener('navigateerror', this);
  }

  public componentWillUnmount(): void {
    window.navigation.removeEventListener('currententrychange', this);
    window.navigation.removeEventListener('navigate', this);
    window.navigation.removeEventListener('navigatesuccess', this);
    window.navigation.removeEventListener('navigateerror', this);
  }

  public onnavigate(e: NavigateEvent) {
    super.onnavigate(e);
    this.#committed = new PromiseWrapper();
  };

  public oncurrententrychange() {
    this.#committed?.resolve?.(window.navigation.currentEntry!);
  };

  public onnavigatesuccess() {
    this.#committed = null;
  };

  public onnavigateerror({ error }: ErrorEvent) {
    if (this.#committed?.state === 'pending')
      this.#committed.reject?.(error); // TODO: find out what the spec does for cancelled navigations
    this.#committed = null;
    if (this.screenTransitionLayer.current?.animation.playState === 'running')
      this.screenTransitionLayer.current.animation.cancel();
  };

  // TODO: change to use handleEvent paradigm
  private readonly onGestureCancel = () => {
    if (!this.state.transition)
      throw new Error('Rollback failed, transition is null');
    window.navigation.traverseTo(this.state.transition.from.key, {
      info: { rollback: true },
    });
  };

  private canGestureNavigate(e: SwipeStartEvent) {
    if (!this.ref.current) return false;
    if (this.state.gestureDisabled) return false;
    const clientRect = this.ref.current.getBoundingClientRect();
    const { direction } = e;
    if (
      (direction === 'down' || direction === 'right')
      && !this.navigation.canGoBack()
    )
      return false;
    if (
      (direction === 'up' || direction === 'left')
      && !this.navigation.canGoForward()
    )
      return false;
    if (
      isWithinGestureInset(
        direction,
        e,
        clientRect,
        this.state.gestureAreaWidth
      )
    )
      return false;

    return isSupportedDirection(direction, this.state.gestureDirection);
  }

  public onswipestart(e: SwipeStartEvent) {
    if (!this.canGestureNavigate(e)) return;
    if (!this.ref.current || !this.screenTransitionLayer.current) return;
    const { direction } = e;

    const axis: 'x' | 'y' = isHorizontalDirection(direction) ? 'x' : 'y';
    let rangeStart;
    let rangeEnd;
    switch (direction) {
      case 'right':
        rangeStart = Number();
        rangeEnd = this.ref.current.clientWidth;
        break;
      case 'left':
        rangeStart = this.ref.current.clientWidth;
        rangeEnd = Number();
        break;
      case 'down':
        rangeStart = Number();
        rangeEnd = this.ref.current.clientHeight;
        break;
      case 'up':
        rangeStart = this.ref.current.clientHeight;
        rangeEnd = Number();
        break;
    }
    this.screenTransitionLayer.current.animation.timeline = new GestureTimeline(
      {
        source: this.ref.current,
        type: 'swipe',
        axis,
        rangeStart,
        rangeEnd,
      }
    );
    const gesture = true;
    if (direction === 'down' || direction === 'right')
      window.navigation.traverseTo(this.navigation.previous!.key, {
        info: { gesture },
      });
    else
      window.navigation.traverseTo(this.navigation.next!.key, {
        info: { gesture },
      });

    this.dispatchEvent(new GestureStartEvent(e));
  };

  public onswipeend(e: SwipeEndEvent) {
    if (!this.screenTransitionLayer.current) return;
    const progress =
      this.screenTransitionLayer.current.animation.effect?.getComputedTiming()
        .progress ?? Number();
    const playbackRate =
      this.screenTransitionLayer.current.animation.playbackRate;
    this.screenTransitionLayer.current.animation.timeline = document.timeline;
    const hysteresisReached =
      playbackRate > Number()
        ? progress > this.state.gestureHysteresis
        : progress < this.state.gestureHysteresis;
    let gestureCancelled = false;
    if (e.velocity < this.state.gestureMinFlingVelocity && !hysteresisReached) {
      gestureCancelled = true;
      this.screenTransitionLayer.current.animation.reverse();
      this.dispatchEvent(new GestureCancelEvent());
    } else {
      this.dispatchEvent(new GestureEndEvent(e));
    }
    if (gestureCancelled) {
      this.screenTransitionLayer.current.animation.finished.then(() => {
        this.state.controller?.abort('gesture-cancel');
      });
    }
  };

  public get committed() {
    return this.#committed?.promise ?? null;
  }

  private get backNavigating() {
    const fromIndex = this.state.screenStack.findIndex(
      (screen) => screen.key === this.state.fromKey
    );
    const destinationIndex = this.state.screenStack.findIndex(
      (screen) => screen.key === this.state.destinationKey
    );

    return destinationIndex >= FIRST_INDEX && destinationIndex < fromIndex;
  }

  protected get screens() {
    const screenStack = this.state.screenStack;
    return screenStack.filter((screen, index) => {
      const currentScreenRef = screen.props.ref ?? null;
      const nextScreenRef = screenStack.at(
        index + SINGLE_ELEMENT_LENGTH
      )?.props.ref;
      return (
        (isRefObject(currentScreenRef)
          && currentScreenRef.current?.focused)
        || (isRefObject(currentScreenRef)
          && currentScreenRef.current?.config.keepAlive)
        || (isRefObject(nextScreenRef)
          && nextScreenRef.current?.config.presentation === 'modal')
        || (isRefObject(nextScreenRef)
          && nextScreenRef.current?.config.presentation === 'dialog')
        || screen.key === this.navigation.current?.key
        || screen.key === this.state.fromKey
        || screen.key === this.state.destinationKey
      );
    });
  }

  private cloneScreenChildFromPathname(
    pathname: string,
    key: React.Key | null,
    entry: HistoryEntry
  ) {
    const { child } = this.screenChildFromPathname(pathname) ?? {};

    if (!child) return null;
    key ??= crypto.randomUUID();
    return cloneAndInject(child, {
      config: {
        title: document.title,
        ...this.props.config?.screenConfig,
        ...child.props.config,
      },
      id: key,
      resolvedPathname: pathname,
      entry,
      key,
      ref: createRef<Screen>(),
    } as InjectedScreenProps);
  }

  private getScreenRefByKey(key: string) {
    const screen = this.state.screenStack.find(
      (screen) => screen.key === key
    )?.props.ref;
    if (isRefObject(screen)) return screen;
    return null;
  }

  protected canIntercept(e: NavigateEvent): boolean {
    const pathname = new URL(e.destination.url).pathname;
    const baseURLPattern = this.baseURLPattern.pathname;
    return (
      this.mounted
      && this.shouldIntercept(e)
      && this.includesRoute(pathname, baseURLPattern)
    );
  }

  protected shouldIntercept(e: NavigateEvent): boolean {
    const shouldIntercept =
      e.canIntercept && !e.formData && !e.hashChange && !e.downloadRequest;
    return shouldIntercept || Boolean(this.props.config?.shouldIntercept?.(e));
  }

  protected intercept(e: NavigateEvent | LoadEvent): void {
    if (!(e instanceof LoadEvent)) this.props.config?.onIntercept?.(e);
    if (e.defaultPrevented) return;

    switch (e.navigationType) {
      case 'preload':
        this.handlePreload(e);
        break;
      case 'load':
        this.handleLoad(e);
        break;

      case 'reload':
      case 'replace':
        this.handleReplace(e);
        break;

      default:
        this.handleDefault(e);
        break;
    }
  }

  public handlePreload(
    e: LoadEvent
  ) {
    const handler = () => {
      const { pathname } = new URL(e.destination.url);
      const {
        child,
        matchInfo = null,
      } = this.screenChildFromPathname(pathname) ?? {};
      if (!child) return Promise.resolve();
      const { navigation } = this;
      const { signal } = e;
      const { path } = child.props;

      const { transition } = e;
      return new Promise<void>(resolve => {
        this.setState({ transition }, async () => {
          const historyEntryState = Screen.historyEntryStateFromEntry(
            new HistoryEntry(
              historyEntryFromDestination(e.destination),
              this.id,
              LAST_INDEX
            ),
            matchInfo
          );
          await Promise.all([
            this.preloadScreen(child),
            child.props.config?.onLoad?.({
              navigation,
              signal,
              preloading: true,
              route: {
                focused: false,
                path,
                resolvedPathname: pathname,
                config: {
                  ...this.props.config?.screenConfig,
                  ...child.props.config,
                  ...historyEntryState.config,
                },
                params: {
                  ...child.props.defaultParams,
                  ...matchInfo?.params,
                  ...historyEntryState.params,
                },
              },
            }),
          ]);
          this.setState({ transition: null }, resolve);
        });
      });
    };

    e.intercept({ handler });
  }

  private handleLoad(e: LoadEvent) {
    const handler = () => {
      const fromKey = e.transition?.from?.key ?? null;
      const destinationKey = e.destination.key;
      const transition = e.transition;
      const screenStack: RouterState['screenStack'] = [];
      const entries = this.navigation.entries;
      entries.forEach((entry) => {
        if (!entry.url) return null;
        const screen = this.cloneScreenChildFromPathname(
          entry.url.pathname,
          entry.key,
          entry
        );
        if (!screen) return null;
        screenStack.push(screen);
      });

      return new Promise<void>((resolve, reject) =>
        startTransition(() => {
          this.setState(
            { screenStack, fromKey, transition, destinationKey },
            async () => {
              const { initialPathname } = this.props.config ?? {};
              const [firstEntry] = entries;
              if (
                initialPathname
                && entries.length === SINGLE_ELEMENT_LENGTH
                && firstEntry.url
                && !matchRoute(
                  initialPathname,
                  firstEntry.url.pathname,
                  this.baseURLPattern.pathname
                )
              ) {
                const transitionFinished =
                  window.navigation.transition?.finished ?? Promise.resolve();
                transitionFinished.then(() => {
                  this.navigation.replace(initialPathname).finished.then(() => {
                    const state =
                      (e.destination.getState() as HistoryEntryState) ?? {};
                    this.navigation.push(e.destination.url, state);
                  });
                });
                return resolve();
              }
              const signal = e.signal;

              const currentScreen = this.getScreenRefByKey(
                String(destinationKey)
              );
              await this.dispatchLifecycleHandlers(
                currentScreen,
                null,
                signal
              ).catch(reject);
              this.setState(
                { destinationKey: null, fromKey: null, transition: null },
                resolve
              );
            }
          );
        })
      );
    };

    e.intercept({ handler });
  }

  private handleReplace(e: NavigateEvent) {
    const screenStack = this.state.screenStack;
    const destination = e.destination;
    const destinationPathname = new URL(destination.url).pathname;
    const destinationKey =
      window.navigation.currentEntry?.key ?? null;
    const destinationScreen = this.cloneScreenChildFromPathname(
      destinationPathname,
      destinationKey,
      new HistoryEntry(
        historyEntryFromDestination(destination),
        this.id,
        destination.index
      )
    );
    if (!destinationScreen) return e.preventDefault();
    const precommitHandler = () => {
      const transition = this.state.transition ?? window.navigation.transition;
      const fromKey = transition?.from?.key ?? null;
      const currentIndex = screenStack.findIndex(
        (screen) => screen.key === this.navigation.current?.key
      );
      screenStack.splice(
        currentIndex,
        SINGLE_ELEMENT_LENGTH,
        destinationScreen
      );

      return new Promise<void>((resolve, reject) =>
        startTransition(() => {
          this.setState(
            { destinationKey, fromKey, transition, screenStack },
            async () => {
              const signal = e.signal;
              const incomingScreen = this.getScreenRefByKey(
                String(destinationKey)
              );
              const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(
                incomingScreen,
                null,
                signal
              ).catch(reject);
              await pendingLifecycleHandlers;
              resolve();
            }
          );
        })
      )
        .finally(() => {
          this.setState({
            destinationKey: null,
            fromKey: null,
            transition: null,
          });
        });
    };

    e.intercept({ precommitHandler });
  }

  private handleDefault(e: NavigateEvent) {
    const screenStack = this.state.screenStack;
    const destination = e.destination;
    const destinationPathname = new URL(destination.url).pathname;
    if (!this.screenChildFromPathname(destinationPathname))
      return e.preventDefault();
    const precommitHandler = () => {
      const transition = window.navigation.transition;
      let fromIndex = this.navigation.entries.findIndex(
        (entry) => entry.globalIndex === transition?.from.index
      );
      // if navigating from a nested screen the first lookup won't work since entries are scoped
      if (
        e.navigationType === 'traverse'
        && fromIndex === LAST_INDEX
        && transition?.from.url
      ) {
        const fromEntry = AnchorBase.findClosestEntryByHref(
          transition.from.url,
          undefined,
          this.navigation.entries.map(entry => entry.nativeEntry),
          this.navigation.current.index
        );
        fromIndex = this.navigation.entries.findIndex(
          (entry) => entry.globalIndex === fromEntry?.index
        );
      }
      const fromKey =
        screenStack[fromIndex]?.key ?? null;
      const destinationIndex = this.navigation.entries.findIndex(
        (entry) => entry.globalIndex === destination.index
      );
      let destinationKey =
        screenStack[destinationIndex]?.key
        ?? null;
      if (e.navigationType === 'push') {
        const destinationPathname = new URL(destination.url).pathname;
        const destinationScreen = this.cloneScreenChildFromPathname(
          destinationPathname,
          destinationKey,
          new HistoryEntry(
            historyEntryFromDestination(destination),
            this.id,
            destination.index
          )
        );
        if (!destinationScreen) return Promise.resolve();
        destinationKey = destinationScreen.key;
        screenStack.splice(
          fromIndex + SINGLE_ELEMENT_LENGTH,
          Infinity, // Remove all screens after current
          destinationScreen
        );
      }

      const controller = new AbortController();
      return new Promise<void>((resolve, reject) =>
        startTransition(() => {
          this.setState(
            { controller, destinationKey, fromKey, transition, screenStack },
            async () => {
              controller.signal.onabort = reject;
              const signal = e.signal;
              const outgoingScreen = this.getScreenRefByKey(String(fromKey));
              const incomingScreen = this.getScreenRefByKey(
                String(destinationKey)
              );
              const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(
                incomingScreen,
                outgoingScreen,
                signal
              ).catch(reject);
              const animation = this.screenTransition(
                incomingScreen,
                outgoingScreen
              );
              animation?.updatePlaybackRate(DEFAULT_PLAYBACK_RATE);
              animation?.finished.catch(reject);
              await pendingLifecycleHandlers;
              resolve();
            }
          );
        })
      )
        .finally(() => {
          this.setState(
            {
              destinationKey: null,
              fromKey: null,
              transition: null,
              controller: null,
            }
          );
        });
    };

    if (isGesture(e.info)) {
      this.addEventListener('gesture-cancel', this.onGestureCancel, {
        once: true,
      });
    }
    const options = { precommitHandler };
    e.intercept(options);
  }

  private async dispatchLifecycleHandlers(
    incomingScreen: React.RefObject<Screen> | null,
    outgoingScreen: React.RefObject<Screen> | null,
    signal: AbortSignal
  ) {
    let animationStarted = false;
    this.addEventListener(
      'routertransitionstart',
      () => (animationStarted = true),
      { once: true }
    );

    await Promise.all([
      outgoingScreen?.current?.onExit(signal),
      incomingScreen?.current?.onEnter(signal),
      incomingScreen?.current?.load(signal),
    ]);

    if (animationStarted)
      await new Promise((resolve) =>
        this.addEventListener('routertransitionend', resolve, { once: true })
      );

    // if gesture navigation cancelled then exit here
    if (this.state.controller?.signal.aborted) return;

    await Promise.all([
      outgoingScreen?.current
        ?.onExited(signal)
        .then(() => outgoingScreen.current?.blur()),
      incomingScreen?.current
        ?.onEntered(signal)
        .then(() => incomingScreen.current?.focus()),
    ]);
  }

  private screenTransition(
    incomingScreen: React.RefObject<Screen> | null,
    outgoingScreen: React.RefObject<Screen> | null
  ) {
    const { backNavigating } = this;
    const screenTransitionLayer = this.screenTransitionLayer.current;
    if (
      screenTransitionLayer
      && incomingScreen
      && outgoingScreen
    ) {
      screenTransitionLayer.direction = backNavigating
        ? 'reverse'
        : 'normal';
      if (incomingScreen.current?.transitionProvider.current) {
        incomingScreen.current.transitionProvider.current.exiting = false;
      }
      if (outgoingScreen.current?.transitionProvider.current) {
        outgoingScreen.current.transitionProvider.current.exiting = true;
      }
      const sharedElementTransitionLayer = screenTransitionLayer
        .sharedElementTransitionLayer
        .current;
      if (
        sharedElementTransitionLayer
      ) {
        sharedElementTransitionLayer.outgoingScreen = outgoingScreen;
        sharedElementTransitionLayer.incomingScreen = incomingScreen;
      }
      const topScreenIndex = this.screens.findIndex(
        (screen) =>
          screen.props.ref === (
            backNavigating
              ? outgoingScreen
              : incomingScreen
          )
      );
      screenTransitionLayer.screens = this.screens
        .map((screen, index) => {
          // normalise indices making incoming screen index 1 and preceding screens index 0...-n
          index = index - topScreenIndex + SINGLE_ELEMENT_LENGTH;
          if (
            isRefObject(screen.props.ref)
            && screen.props.ref.current?.transitionProvider.current
          ) {
            screen.props.ref.current.transitionProvider.current.index = index;
            return screen.props.ref;
          }
          return null;
        })
        .filter(isRefObject);

      return screenTransitionLayer.transition();
    }
  }

  public render() {
    const gestureRegionBehaviour = this.state.gestureDisabled
      ? 'none'
      : 'contain';

    return (
      <GestureRegion.div
        id={this.id}
        ref={this.ref}
        style={{
          display: 'contents',
          width: '100%',
          height: '100%',
        }}
        gestureBehaviour={gestureRegionBehaviour}
      >
        {super.render()}
      </GestureRegion.div>
    );
  }
}
