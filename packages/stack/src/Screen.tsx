import { ScreenBase, matchRoute } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { Children, isValidElement } from 'react';

export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<ScreenProps, T, Navigation> { }

type Presentation = "default" | "dialog" | "modal";
export interface ScreenProps extends ScreenBaseProps {
    config?: ScreenBaseProps["config"] & {
        presentation?: Presentation;
        keepAlive?: boolean;
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

    onEnter(signal: AbortSignal) {
        if (
            this.screenAnimationProvider?.ref instanceof HTMLDialogElement
            && this.screenAnimationProvider.ref.open === false
        ) {
            const navigation = this.context?.navigation as Navigation | undefined;
            if (this.props.config?.presentation === "modal") {
                this.screenAnimationProvider.ref.showModal();
            } else {
                this.screenAnimationProvider.ref.show();
            }
            this.screenAnimationProvider.ref.style.maxHeight = 'unset';
            this.screenAnimationProvider.ref.style.maxWidth = 'unset';
            this.screenAnimationProvider.ref.style.width = 'max-content';
            this.screenAnimationProvider.ref.style.height = 'max-content';
            if (this.ref) {
                this.ref.style.width = 'max-content';
                this.ref.style.height = 'max-content';
            }

            // closed by form submit or ESC key
            this.screenAnimationProvider?.ref.addEventListener('close', function () {
                if (this.returnValue !== "screen-exit") {
                    this.style.display = "block";
                    navigation?.goBack();
                }
            }, { once: true });

            // close by backdrop click
            this.screenAnimationProvider.ref.onclick = (e) => {
                if (!this.screenAnimationProvider?.ref) return;
                const rect = this.screenAnimationProvider.ref.getBoundingClientRect();
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
        if (this.screenAnimationProvider?.ref instanceof HTMLDialogElement) {
            this.screenAnimationProvider.ref.close("screen-exit");
        }

        return super.onExited(signal);
    }
}