import { matchRoute, ScreenBase } from '@react-motion-router/core';
import type {
  PlainObject,
  ScreenBaseProps,
  ScreenBaseState,
  ScreenBaseComponentProps,
  ScreenBaseConfig
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
}

export class Screen extends ScreenBase<
  ScreenProps,
  ScreenBaseState,
  RouteProp
> {
  readonly #historyEntry: HistoryEntry;

  constructor(props: ScreenProps, router: Router) {
    super(props, router);

    const id = this.internalProps.id;
    const historyEntry = router.navigation
      .entries
      .find(entry => entry.key === id);
    if (!historyEntry)
      throw new Error(`No history entry found for: ${id}`);
    this.#historyEntry = historyEntry;
  }

  public static getDerivedStateFromProps(props: ScreenProps) {
    if (
      props.config?.presentation === 'dialog'
      || props.config?.presentation === 'modal'
    )
      return { elementType: 'dialog' };
    else
      return { elementType: 'div' };
  }

  protected setParams(newParams: PlainObject): void {
    super.setParams(newParams);
    this.setHistoryState(
      ({ params }) => ({ params: { ...params, ...newParams } })
    );
  }

  protected setConfig(newConfig: NonNullable<ScreenProps['config']>): void {
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
    if (entry?.url) {
      const state = entry.getState<HistoryEntryState>() ?? {};
      const queryParams = searchParamsToObject(entry.url.searchParams);
      const pathParams = matchRoute(
        this.props.path,
        entry.url.pathname,
        this.context.baseURLPattern.pathname,
        this.props.caseSensitive
      )?.params;
      state.params = {
        ...state.params,
        ...queryParams,
        ...pathParams,
      };

      return state;
    }
    return {};
  }

  public get id() {
    return this.internalProps.id.toString();
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

  private onClickOutside(e: MouseEvent) {
    if (!this.transitionProvider.current?.ref.current) return;
    const navigation = this.context?.navigation as Navigation | undefined;
    if (
      e.composedPath().includes(this.transitionProvider.current.ref.current)
    ) return;
    navigation?.goBack();
  }

  public onEnter(signal: AbortSignal) {
    const transitionProviderRef = this.transitionProvider.current?.ref;
    if (
      transitionProviderRef?.current instanceof HTMLDialogElement
      && transitionProviderRef.current.open === false
    ) {
      const navigation = this.context?.navigation as Navigation | undefined;
      if (this.props.config?.presentation === 'modal') {
        transitionProviderRef.current.showModal();
      } else {
        transitionProviderRef.current.show();
      }
      transitionProviderRef.current.style.maxHeight = 'unset';
      transitionProviderRef.current.style.maxWidth = 'unset';
      transitionProviderRef.current.style.width = 'max-content';
      transitionProviderRef.current.style.height = 'max-content';

      const onClickOutside = this.onClickOutside.bind(this);

      // closed by form submit or ESC key
      transitionProviderRef.current.addEventListener('close', function () {
        if (this.returnValue !== 'screen-exit') {
          this.style.display = 'block';
          navigation?.goBack();
        }

        navigation?.removeEventListener('click', onClickOutside);
      }, { once: true });

      navigation?.addEventListener('click', onClickOutside);
    }

    return super.onEnter(signal);
  };

  public onExited(signal: AbortSignal) {
    const transitionProviderRef = this.transitionProvider.current?.ref;
    if (transitionProviderRef?.current instanceof HTMLDialogElement) {
      transitionProviderRef.current.close('screen-exit');
    }

    return super.onExited(signal);
  }
}