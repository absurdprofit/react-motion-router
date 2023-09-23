import { ScreenBase, matchRoute } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import Navigation from './Navigation';
import { Children, isValidElement } from 'react';

export namespace Stack {
    export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<ScreenProps, T, Navigation> {}

    type Presentation = "default" | "dialog" | "modal";
    interface ScreenProps extends ScreenBaseProps {
        config?: ScreenBaseProps["config"] & {
            presentation?: Presentation;
        }
    }
    
    interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase<ScreenProps, ScreenState> {
        constructor(props: ScreenProps) {
            super(props);

            if (
                props.config?.presentation === "dialog"
                || props.config?.presentation === "modal"
            )
                this.elementType = "dialog";
        }
        onEnter = () => {
            super.onEnter();
            if (
                this.animationProviderRef instanceof HTMLDialogElement
                && this.animationProviderRef.open === false
            ) {
                const navigation = this.context?.navigation;
                if (this.props.config?.presentation === "modal") {
                    this.animationProviderRef.showModal();
                } else {
                    this.animationProviderRef.show();
                }
                this.animationProviderRef.style.maxHeight = 'unset';
                this.animationProviderRef.style.maxWidth = 'unset';
                this.animationProviderRef.style.width = 'max-content';
                this.animationProviderRef.style.height = 'max-content';
                if (this.ref) {
                    this.ref.style.width = 'max-content';
                    this.ref.style.height = 'max-content';
                }

                // closed by form submit or ESC key
                this.animationProviderRef.addEventListener('close', function(e) {
                    if (this.returnValue !== "screen-exit") {
                        this.style.display = "block";
                        navigation?.goBack();
                    }
                }, {once: true});

                // close by backdrop click
                this.animationProviderRef.addEventListener('click', function(e) {
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
        };

        onExit(): void {
            const current = this.context?.navigation.history.current;
            const routes = Children.toArray(this.context?.routes);
            const nextRoute = routes.find(route => {
                return isValidElement(route) && matchRoute(route.props.path, current);
            }) as ScreenBase<ScreenProps, ScreenState> | undefined;
            if (nextRoute?.props.config?.presentation === "modal"
                || nextRoute?.props.config?.presentation === "dialog") {
                    // if next screen is modal or dialog, keep current screen alive
                    this.setState({shouldKeepAlive: true});
                    this.setConfig({keepAlive: true});
            }
        }

        onExited = () => {
            super.onExited();
            if (this.animationProviderRef instanceof HTMLDialogElement) {
                this.animationProviderRef.close("screen-exit");
            }
        }
    }
}
