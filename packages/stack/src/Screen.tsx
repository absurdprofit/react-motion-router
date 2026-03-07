import { matchRoute, ScreenBase } from '@react-motion-router/core';
import type {
  PlainObject,
  ScreenBaseProps,
  ScreenBaseState,
  ScreenBaseComponentProps,
  ScreenBaseConfig,
  MatchedRoute,
  ElementForTag
} from '@react-motion-router/core';
import { Navigation } from './Navigation';
import {
  HistoryEntryState,
  RouteProp,
  ScreenInternalProps,
  SwipeDirection
} from './common/types';
import { Router } from './Router';
import { searchParamsToObject } from './common/utils';
import { HistoryEntry } from './HistoryEntry';
import { createRef, RefObject } from 'react';

export type ScreenComponentProps<
  T extends PlainObject = object
> = ScreenBaseComponentProps<RouteProp<T>, Navigation>;

export interface ScreenConfig extends ScreenBaseConfig<RouteProp> {
  readonly title?: string;
  readonly presentation?: 'default' | 'dialog' | 'modal';
  readonly keepAlive?: boolean;
  readonly gestureDirection?: SwipeDirection;
  readonly gestureAreaWidth?: number;
  readonly gestureMinFlingVelocity?: number;
  readonly gestureHysteresis?: number;
  readonly gestureDisabled?: boolean;
}

export interface ScreenProps extends ScreenBaseProps {
  config?: ScreenConfig;
  ref?: RefObject<Screen | null>
}

export type ScreenState = ScreenBaseState;

export class Screen extends ScreenBase<
  ScreenProps,
  ScreenState,
  RouteProp
> {
  readonly #historyEntry: HistoryEntry;
  protected ref = createRef<ElementForTag<'div' | 'dialog'>>();

  constructor(props: ScreenProps, router: Router) {
    super(props, router);

    this.#historyEntry = this.internalProps.entry;
  }

  public static historyEntryStateFromEntry(
    entry: HistoryEntry,
    matchInfo: MatchedRoute | null
  ) {
    if (entry?.url) {
      const state = entry.getState<HistoryEntryState>() ?? {};
      const queryParams = searchParamsToObject(entry.url.searchParams);
      const { params: pathParams = {} } = matchInfo ?? {};
      state.params = {
        ...state.params,
        ...queryParams,
        ...pathParams,
      };

      return state;
    }
    return {};
  }

  protected override setParams(newParams: PlainObject): void {
    super.setParams(newParams);
    this.setHistoryState(
      ({ params }) => ({ params: { ...params, ...newParams } })
    );
  }

  protected override setConfig(
    newConfig: NonNullable<ScreenProps['config']>
  ): void {
    super.setConfig(newConfig);
    this.setHistoryState(({ config }) => {
      // navigation history state can only accept structured cloneable objects.
      // a lot of the config options are function which cannot be structured cloned.
      const unsafe = new Set([
        'footer', 'header',
        'onEnter', 'onEntered',
        'onExit', 'onExited',
        'onLoad',
        'animation',
      ]);
      return {
        config: {
          ...config,
          ...Object.fromEntries(
            Object.entries(newConfig).filter(([key]) => !unsafe.has(key))
          ),
        },
      };
    });
  }

  protected get router() {
    return this.context as Router;
  }

  private get internalProps() {
    return this.props as unknown as ScreenInternalProps;
  }

  public get resolvedPathname() {
    return this.internalProps.resolvedPathname;
  }

  private get historyEntryState() {
    const entry = this.#historyEntry;
    if (!entry.url) return {};
    const matchInfo = matchRoute(
      this.props.path,
      entry.url.pathname,
      this.router.baseURLPattern.pathname,
      this.props.caseSensitive
    );
    return Screen.historyEntryStateFromEntry(entry, matchInfo);
  }

  public get inert() {
    if (this.state.focused)
      return undefined;
    return true;
  }

  public get elementType(): React.JSX.ElementType {
    const presentation = this.props.config?.presentation;
    if (
      presentation === 'dialog'
      || presentation === 'modal'
    )
      return 'dialog';
    else
      return 'div';
  }

  public get id() {
    return this.internalProps.id.toString();
  }

  public get viewTransitionName() {
    return `${this.router.id}-${this.name}`;
  }

  public get params() {
    return {
      ...this.props.defaultParams,
      ...this.historyEntryState.params,
      ...this.state.params,
    };
  }

  public get config() {
    return {
      ...this.props.config,
      ...this.historyEntryState.config,
      ...this.state.config,
    };
  }

  protected get routeProp() {
    const setParams = this.setParams.bind(this);
    const setConfig = this.setConfig.bind(this);
    const{ path } = this.props;
    const { focused } = this.state;
    const { params, config, resolvedPathname } = this;
    return {
      setParams,
      setConfig,
      path,
      resolvedPathname,
      focused,
      params,
      config,
    };
  }

  protected setHistoryState(
    newState: PlainObject | ((prevState: PlainObject) => PlainObject)
  ) {
    if (!this.state.focused) return;
    const prevState = this.#historyEntry.getState<HistoryEntryState>() ?? {};
    if (newState instanceof Function) {
      newState = newState(prevState);
    }
    const state = {
      ...prevState ?? {},
      ...newState,
    };
    window.navigation.updateCurrentEntry({ state });
  }

  public onclick(e: MouseEvent) {
    if (!this.ref.current) return;
    const navigation = this.context?.navigation as Navigation | undefined;
    if (
      e.composedPath().includes(this.ref.current)
    ) return;
    navigation?.goBack();
  }

  public onclose() {
    this.router.navigation.goBack();
  }

  public override onEnter(signal: AbortSignal) {
    if (
      this.ref?.current instanceof HTMLDialogElement
      && this.ref.current.open === false
    ) {
      const navigation = this.router.navigation;
      if (this.props.config?.presentation === 'modal') {
        this.ref.current.showModal();
      } else {
        this.ref.current.show();
      }
      this.ref.current.style.maxHeight = 'unset';
      this.ref.current.style.maxWidth = 'unset';
      this.ref.current.style.width = 'max-content';
      this.ref.current.style.height = 'max-content';

      // closed by form submit or ESC key
      this.ref.current.addEventListener('close', this, { once: true });

      navigation.addEventListener('click', this, { once: true });
    }

    return super.onEnter(signal);
  };

  public override onExited(signal: AbortSignal) {
    if (this.ref.current instanceof HTMLDialogElement) {
      this.ref.current.removeEventListener('close', this);
      this.router.navigation.removeEventListener('click', this);
      this.ref.current.close();
    }

    return super.onExited(signal);
  }

  public override render() {
    const Element = this.elementType;

    return (
      <Element
        id={this.viewTransitionName}
        ref={this.ref}
        className="screen"
        inert={this.inert}
        style={{
          gridArea: '1 / 1',
          viewTransitionName: this.viewTransitionName,
        }}
      >
        {super.render()}
      </Element>
    );
  }
}