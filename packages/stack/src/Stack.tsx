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
                this.animationProviderRef.addEventListener('close', function() {
                    if (this.returnValue !== "go-back") {
                        navigation?.goBack();
                    }
                }, {once: true});
            }
        };
    }
}
