import { Component, createContext } from 'react';
import { getCSSData } from './common/utils';
import { EasingFunction, PlainObject, SharedElementNode, SharedElementNodeMap, TransformOrigin, TransitionAnimation, Vec2 } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';
import { createPortal } from 'react-dom';


function nodeFromRef(
    id: string,
    _ref: Element,
    instance: SharedElement
): SharedElementNode | null {
    const firstChild = _ref.firstElementChild as HTMLElement;

    if (!firstChild) return null;

    if (instance.props.config && instance.props.config.transformOrigin) {
        firstChild.style.transformOrigin = instance.props.config.transformOrigin;
    }

    return {
        id: id,
        instance: instance
    };
}

interface SharedElementConfig {
    type?: TransitionAnimation;
    transformOrigin?: TransformOrigin;
    easingFunction?: EasingFunction;
    duration?: number;
    delay?: number;
    x?: {
        delay?: number;
        duration?: number;
        easingFunction?: EasingFunction
    };
    y?: {
        delay?: number;
        duration?: number;
        easingFunction?: EasingFunction
    };
}

interface SharedElementProps {
    id: string | number;
    children: React.ReactChild;
    disabled?: boolean;
    config?: SharedElementConfig;
}

interface SharedElementState {}

const transformKeys = ["transform", "top", "left", "right", "bottom"];
export class SharedElement extends Component<SharedElementProps, SharedElementState> {
    private ref: HTMLDivElement | null = null;
    static readonly contextType = SharedElementSceneContext;
    context!: React.ContextType<typeof SharedElementSceneContext>;

    get canTransition() {
        return Boolean(this.scene.previousScene?.nodes.has(this.id)) && this.scene.canTransition;
    }

    get scene() {
        return this.context!;
    }

    get node() {
        if (this.ref) {
            if (
                this.ref.firstElementChild instanceof HTMLVideoElement
                && (this.transitionType ?? "morph") === "morph"
            ) {
                return this.ref;
            }
            return this.ref.cloneNode(true) as HTMLElement;
        }
        else return null;
    }

    get rect() {
        if (this.ref && this.ref.firstElementChild) {
            const clientRect = this.ref.firstElementChild.getBoundingClientRect();
            return clientRect;
        }
        return new DOMRect();
    }

    get CSSData(): [string, PlainObject<string>] {
        return ['', {}];
    }

    get CSSText(): string {
        return '';
    }

    get id() {
        return this.props.id.toString();
    }

    get transitionType() {
        return this.props.config?.type;
    }

    get animationEffect() {
        return null;
    }

    onCloneAppended = (e: HTMLElement) => { }

    onCloneRemove = (e: HTMLElement) => {
        if (this.ref?.firstElementChild instanceof HTMLVideoElement) {
            const node = e.firstElementChild as HTMLVideoElement;
            this.ref.firstElementChild.currentTime = node.currentTime;
            if (!node.paused) {
                node.pause();
            }
        }
    }

    keepAlive(keepAlive: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.setState({ keepAlive }, resolve);
        });
    }

    hidden(hidden: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.setState({ hidden }, resolve);
        });
    }

    private onRef = (ref: HTMLDivElement | null) => {
        if (this.ref !== ref) {
            if (this.ref) {
                this.scene.removeNode(this.id);
            }
            this.ref = ref;

            if (ref && !this.props.disabled) {
                this.scene.addNode(nodeFromRef(this.id, ref, this));
            }

            this.forceUpdate();
        }

    }

    componentDidUpdate() {
        if (this.props.disabled && this.scene.nodes.has(this.id)) {
            this.scene.removeNode(this.id);
        }
    }

    render() {
        return (
            <div
                ref={this.onRef}
                id={`shared-element-${this.id}`}
            >
                {this.ref && createPortal(this.props.children, this.ref, this.id)}
            </div>
        );
    }
}