import { ScreenBase } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import Navigation from './Navigation';

export namespace Stack {
    export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<T, Navigation> {}

    type Presentation = "default" | "dialog";
    interface ScreenProps extends ScreenBaseProps {
        config?: ScreenBaseProps["config"] & {
            presentation?: Presentation;
        }
    }
    
    interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase<ScreenProps, ScreenState> {
        constructor(props: ScreenProps) {
            super(props);

            if (props.config?.presentation === "dialog")
                this.elementType = "dialog";
        }
        onEnter = () => {
            super.onEnter();
            if (
                this.animationProviderRef instanceof HTMLDialogElement
                && this.animationProviderRef.open === false
            ) {
                const navigation = this.context?.navigation;
                this.animationProviderRef.showModal();
                
                // closed by navigation.goBack()
                navigation?.addEventListener('go-back', (e) => {
                    if (this.animationProviderRef instanceof HTMLDialogElement) {
                        e.detail.finished.then(
                            this.animationProviderRef.close.bind(
                                this.animationProviderRef,
                                "go-back"
                            )
                        );
                    }
                }, {once: true});

                // closed by form submit or ESC key
                this.animationProviderRef.addEventListener('close', function(e) {
                    if (this.returnValue !== "go-back") {
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
                });
            }
        };
    }
}
