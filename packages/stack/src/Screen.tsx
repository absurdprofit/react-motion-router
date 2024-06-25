import { ScreenBase, matchRoute } from '@react-motion-router/core';
import type { PlainObject, ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { Children, isValidElement } from 'react';
import { RouteProp, SwipeDirection } from './common/types';

export interface ScreenComponentProps<T extends PlainObject = {}> extends ScreenComponentBaseProps<RouteProp<T>, Navigation> { }

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
    static getDerivedStateFromProps(props: ScreenProps) {
        if (
            props.config?.presentation === "dialog"
            || props.config?.presentation === "modal"
        )
            return { elementType: "dialog" };
        else
            return { elementType: "div" };
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
                ...this.context.screenState.get(this.props.path)?.params
            },
            config: {
                ...this.props.config,
                ...this.context.screenState.get(this.props.path)?.config
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

            // closed by form submit or ESC key
            this.transitionProvider.current?.ref.current.addEventListener('close', function () {
                if (this.returnValue !== "screen-exit") {
                    this.style.display = "block";
                    navigation?.goBack();
                }
            }, { once: true });

            // close by backdrop click
            this.transitionProvider.current.ref.current.onclick = (e) => {
                if (!this.transitionProvider.current?.ref.current) return;
                const rect = this.transitionProvider.current.ref.current.getBoundingClientRect();
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
        if (this.transitionProvider.current?.ref.current instanceof HTMLDialogElement) {
            this.transitionProvider.current.ref.current.close("screen-exit");
        }

        return super.onExited(signal);
    }
}