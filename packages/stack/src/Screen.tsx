import { ScreenBase, matchRoute } from '@react-motion-router/core';
import type { AnimationEffectFactory, LazyExoticComponent, PlainObject, RoutePropBase, ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { Children, JSXElementConstructor, ReactNode, isValidElement } from 'react';
import { RouteProp, SwipeDirection } from './common/types';
import { LifecycleProps } from 'packages/core/build/ScreenBase';

export interface ScreenComponentProps extends ScreenComponentBaseProps<RouteProp, Navigation> { }

type Presentation = "default" | "dialog" | "modal";
export interface ScreenProps extends ScreenBaseProps {
    config?: ScreenBaseProps["config"] & {
        presentation?: Presentation;
        keepAlive?: boolean;
        gestureDirection?: SwipeDirection;
        gestureAreaWidth?: number;
        gestureMinFlingVelocity?: number;
        gestureHysteresis?: number;
        disableGesture?: boolean;
    }
}

export interface ScreenState extends ScreenBaseState { }

export class Screen extends ScreenBase<ScreenProps, ScreenState> {
    constructor(props: ScreenProps) {
        super(props);

        if (
            props.config?.presentation === "dialog"
            || props.config?.presentation === "modal"
        )
            this.elementType = "dialog";
    }

    get routeProp() {
        const focused = this.state.focused;
        const resolvedPathname = this.props.resolvedPathname;
        const setConfig = this.setConfig.bind(this);
        const setParams = this.setParams.bind(this);
        const path = this.props.path;
        return {
            path,
            params: {
                ...this.props.defaultParams,
                ...this.context!.screenState.get(this.props.path)?.params
            },
            config: {
                ...this.props.config,
                ...this.context!.screenState.get(this.props.path)?.config
            },
            focused,
            resolvedPathname,
            setConfig,
            setParams
        };
    }

    protected setParams(params: PlainObject): void {
        super.setParams(params);
        if (this.state.focused)
            window.navigation.updateCurrentEntry({ state: { params } });
    }

    protected setConfig(config: ScreenProps["config"]): void {
        super.setConfig(config);
        if (this.state.focused)
            window.navigation.updateCurrentEntry({ state: { config } });
    }

    onEnter(signal: AbortSignal) {
        if (
            this.screenTransitionProvider?.ref instanceof HTMLDialogElement
            && this.screenTransitionProvider.ref.open === false
        ) {
            const navigation = this.context?.navigation as Navigation | undefined;
            if (this.props.config?.presentation === "modal") {
                this.screenTransitionProvider.ref.showModal();
            } else {
                this.screenTransitionProvider.ref.show();
            }
            this.screenTransitionProvider.ref.style.maxHeight = 'unset';
            this.screenTransitionProvider.ref.style.maxWidth = 'unset';
            this.screenTransitionProvider.ref.style.width = 'max-content';
            this.screenTransitionProvider.ref.style.height = 'max-content';
            if (this.ref) {
                this.ref.style.width = 'max-content';
                this.ref.style.height = 'max-content';
            }

            // closed by form submit or ESC key
            this.screenTransitionProvider?.ref.addEventListener('close', function () {
                if (this.returnValue !== "screen-exit") {
                    this.style.display = "block";
                    navigation?.goBack();
                }
            }, { once: true });

            // close by backdrop click
            this.screenTransitionProvider.ref.onclick = (e) => {
                if (!this.screenTransitionProvider?.ref) return;
                const rect = this.screenTransitionProvider.ref.getBoundingClientRect();
                const isInDialog = (
                    rect.top <= e.clientY
                    && e.clientY <= rect.top + rect.height
                    && rect.left <= e.clientX
                    && e.clientX <= rect.left + rect.width
                );
                if (!isInDialog)
                    navigation?.goBack();
            };
        }

        return super.onEnter(signal);
    };

    onExit(signal: AbortSignal) {
        const navigation = this.context?.navigation as Navigation | undefined;
        const currentPath = navigation?.current?.url?.pathname;
        if (!currentPath) return;
        const baseURL = navigation?.baseURL?.href;
        if (!baseURL) return;
        const routes = Children.toArray(this.context?.props.children);
        const currentRoute = routes.find(route => {
            if (!isValidElement(route)) return false;
            const path = route.props.path;
            const caseSensitive = route.props.caseSensitive;
            return matchRoute(path, currentPath, baseURL, caseSensitive);
        }) as ScreenBase<ScreenProps, ScreenState> | undefined;
        if (currentRoute?.props.config?.presentation === "modal"
            || currentRoute?.props.config?.presentation === "dialog") {
            // if next screen is modal or dialog, keep current screen alive
            this.setConfig({ keepAlive: true });
        }

        return super.onExit(signal);
    }

    onExited(signal: AbortSignal) {
        if (this.screenTransitionProvider?.ref instanceof HTMLDialogElement) {
            this.screenTransitionProvider.ref.close("screen-exit");
        }

        return super.onExited(signal);
    }
}