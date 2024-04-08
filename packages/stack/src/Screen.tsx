import { ScreenBase, matchRoute } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { Children, isValidElement } from 'react';

export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<ScreenProps, T, Navigation> {}

type Presentation = "default" | "dialog" | "modal";
export interface ScreenProps extends ScreenBaseProps {
    config?: ScreenBaseProps["config"] & {
        presentation?: Presentation;
    }
}

export interface ScreenState extends ScreenBaseState {}

export class Screen extends ScreenBase<ScreenProps, ScreenState> {
    constructor(props: ScreenProps) {
        super(props);

        if (
            props.config?.presentation === "dialog"
            || props.config?.presentation === "modal"
        )
            this.elementType = "dialog";
    }

    onEnter() {
        if (
            this.animationProvider?.ref instanceof HTMLDialogElement
            && this.animationProvider.ref.open === false
        ) {
            const navigation = this.context?.navigation as Navigation | undefined;
            if (this.props.config?.presentation === "modal") {
                this.animationProvider.ref.showModal();
            } else {
                this.animationProvider.ref.show();
            }
            this.animationProvider.ref.style.maxHeight = 'unset';
            this.animationProvider.ref.style.maxWidth = 'unset';
            this.animationProvider.ref.style.width = 'max-content';
            this.animationProvider.ref.style.height = 'max-content';
            if (this.ref) {
                this.ref.style.width = 'max-content';
                this.ref.style.height = 'max-content';
            }

            // closed by form submit or ESC key
            this.animationProvider?.ref.addEventListener('close', function(e) {
                if (this.returnValue !== "screen-exit") {
                    this.style.display = "block";
                    navigation?.goBack();
                }
            }, {once: true});

            // close by backdrop click
            this.animationProvider?.ref.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const isInDialog = (
                    rect.top <= e.clientY
                    && e.clientY <= rect.top + rect.height
                    && rect.left <= e.clientX
                    && e.clientX <= rect.left + rect.width
                );
                if (!isInDialog)
                    navigation?.goBack();
            }, {once: true});
        }

        return super.onEnter();
    };

    onExit() {
        const currentPath = this.context?.navigation.current?.url?.pathname;
        if (!currentPath) return;
        const baseURL = this.context?.navigation.baseURL?.href;
        if (!baseURL) return;
        const routes = Children.toArray(this.context?.routes);
        const currentRoute = routes.find(route => {
            if (!isValidElement(route)) return false;
            const path = route.props.path;
            const caseSensitive = route.props.caseSensitive;
            return matchRoute(path, currentPath, baseURL, caseSensitive);
        }) as ScreenBase<ScreenProps, ScreenState> | undefined;
        if (currentRoute?.props.config?.presentation === "modal"
            || currentRoute?.props.config?.presentation === "dialog") {
                // if next screen is modal or dialog, keep current screen alive
                this.setState({shouldKeepAlive: true});
                this.setConfig({keepAlive: true});
        }

        return super.onExit();
    }

    onExited() {
        if (this.animationProvider?.ref instanceof HTMLDialogElement) {
            this.animationProvider.ref.close("screen-exit");
        }

        return super.onExited();
    }
}