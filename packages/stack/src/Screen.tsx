import { ScreenBase } from '@react-motion-router/core';
import type { PlainObject, RouterContext, ScreenBaseProps, ScreenBaseState, ScreenBaseComponentProps, ScreenBaseConfig } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { HistoryEntryState, RouteProp, ScreenInternalProps, SwipeDirection } from './common/types';
import { Router } from './Router';
import { searchParamsToObject } from './common/utils';
import { HistoryEntry } from './HistoryEntry';

export interface ScreenComponentProps<T extends PlainObject = {}> extends ScreenBaseComponentProps<RouteProp<T>, Navigation> { }

export interface ScreenConfig extends ScreenBaseConfig<RouteProp> {
    title?: string;
    presentation?: "default" | "dialog" | "modal";
    keepAlive?: boolean;
    gestureDirection?: SwipeDirection;
    gestureAreaWidth?: number;
    gestureMinFlingVelocity?: number;
    gestureHysteresis?: number;
    gestureDisabled?: boolean;
}

export interface ScreenProps extends ScreenBaseProps {
    config?: ScreenConfig;
}

export interface ScreenState extends ScreenBaseState { }

export class Screen extends ScreenBase<ScreenProps, ScreenState, RouteProp> {
    #historyEntry: HistoryEntry;

    constructor(props: ScreenProps, context: React.ContextType<typeof RouterContext>) {
        super(props, context);

        const router = context as Router;
        const id = this.internalProps.id;
        const historyEntry = router.navigation.entries.find(entry => entry.key === id);
        if (!historyEntry)
            throw new Error(`No history entry found for: ${id}`);
        this.#historyEntry = historyEntry;
    }

    static getDerivedStateFromProps(props: ScreenProps) {
        if (
            props.config?.presentation === "dialog"
            || props.config?.presentation === "modal"
        )
            return { elementType: "dialog" };
        else
            return { elementType: "div" };
    }

    protected setParams(params: PlainObject): void {
        super.setParams(params);
        this.setHistoryState({ params });
    }

    protected setConfig(config: NonNullable<ScreenProps["config"]>): void {
        super.setConfig(config);
        this.setHistoryState({ config });
    }

    protected get router() {
        return this.context as Router;
    }

    get internalProps() {
        return this.props as unknown as ScreenInternalProps;
    }

    get resolvedPathname() {
        return this.internalProps.resolvedPathname;
    }

    get historyEntryState() {
        const entry = this.#historyEntry;
        if (entry?.url) {
            const state = entry.getState<HistoryEntryState>() ?? {};
            const queryParams = searchParamsToObject(entry.url.searchParams);
            state.params = {
                ...state.params,
                ...queryParams
            };

            return state;
        }
        return {};
    }

    get id() {
        return this.internalProps.id.toString();
    }

    get params() {
        return {
            ...this.props.defaultParams,
            ...this.historyEntryState.params,
            ...this.state.params
        };
    }

    get config() {
        return {
            ...this.props.config,
            ...this.historyEntryState.config,
            ...this.state.config
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
            config
        };
    }

    protected setHistoryState(newState: PlainObject) {
        if (!this.state.focused) return;
        const state = {
            ...window.navigation.currentEntry?.getState() ?? {},
            ...newState
        };
        window.navigation.updateCurrentEntry({ state });
    }

    private onClickOutside(e: MouseEvent) {
        if (!this.transitionProvider.current?.ref.current) return;
        const navigation = this.context?.navigation as Navigation | undefined;
        const rect = this.transitionProvider.current.ref.current.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY
            && e.clientY <= rect.top + rect.height
            && rect.left <= e.clientX
            && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog)
            navigation?.goBack();
    }

    onEnter(signal: AbortSignal) {
        if (
            this.transitionProvider.current?.ref.current instanceof HTMLDialogElement
            && this.transitionProvider.current.ref.current.open === false
        ) {
            const navigation = this.context?.navigation as Navigation | undefined;
            if (this.props.config?.presentation === "modal") {
                this.transitionProvider.current.ref.current.showModal();
            } else {
                this.transitionProvider.current.ref.current.show();
            }
            this.transitionProvider.current.ref.current.style.maxHeight = 'unset';
            this.transitionProvider.current.ref.current.style.maxWidth = 'unset';
            this.transitionProvider.current.ref.current.style.width = 'max-content';
            this.transitionProvider.current.ref.current.style.height = 'max-content';
            if (this.ref.current) {
                this.ref.current.style.width = 'max-content';
                this.ref.current.style.height = 'max-content';
            }

            const onClickOutside = this.onClickOutside.bind(this);

            // closed by form submit or ESC key
            this.transitionProvider.current?.ref.current.addEventListener('close', function () {
                if (this.returnValue !== "screen-exit") {
                    this.style.display = "block";
                    navigation?.goBack();
                }

                navigation?.removeEventListener('click', onClickOutside);
            }, { once: true });

            navigation?.addEventListener('click', onClickOutside);
        }

        return super.onEnter(signal);
    };

    onExited(signal: AbortSignal) {
        if (this.transitionProvider.current?.ref.current instanceof HTMLDialogElement) {
            this.transitionProvider.current.ref.current.close("screen-exit");
        }

        return super.onExited(signal);
    }
}