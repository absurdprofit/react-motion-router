import { ScreenBase } from '@react-motion-router/core';
import type { PlainObject, RouterContext, ScreenBaseProps, ScreenBaseState, ScreenBaseComponentProps } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { RouteProp, SwipeDirection } from './common/types';
import { Router } from './Router';

export interface ScreenComponentProps<T extends PlainObject = {}> extends ScreenBaseComponentProps<RouteProp<T>, Navigation> { }

export interface ScreenProps extends ScreenBaseProps {
    config?: ScreenBaseProps["config"] & {
        title?: string;
        presentation?: "default" | "dialog" | "modal";
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
    readonly routeProp;

    constructor(props: ScreenProps, context: React.ContextType<typeof RouterContext>) {
        super(props, context);

        const setParams = this.setParams.bind(this);
        const setConfig = this.setConfig.bind(this);
        const getProps = () => this.props;
        const getState = () => this.state;
        this.routeProp = {
            setParams,
            setConfig,
            get path() {
                return getProps().path;
            },
            get resolvedPathname() {
                return getProps().resolvedPathname;
            },
            get focused() {
                return getState().focused;
            },
            get config() {
                return {
                    ...getProps().config,
                    ...context.screenState.get(this.path)?.config
                };
            },
            get params() {
                return {
                    ...getProps().defaultParams,
                    ...context.screenState.get(this.path)?.params
                };
            }
        };
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

    get config() {
        return {
            ...this.props.config,
            ...this.context.screenState.get(this.props.path)?.config
        };
    }

    get params() {
        return {
            ...this.props.defaultParams,
            ...this.context.screenState.get(this.props.path)?.params
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
    protected get router() {
        return this.context as Router;
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