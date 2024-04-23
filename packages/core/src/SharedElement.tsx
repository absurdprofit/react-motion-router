import { Component, createContext, createRef } from 'react';
import { getCSSData } from './common/utils';
import { EasingFunction, PlainObject, SharedElementNode, SharedElementNodeMap, TransformOrigin, TransitionAnimation, Vec2 } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';
import { createPortal } from 'react-dom';
import { ParallelEffect } from './common/group-effect';

interface SharedElementConfig {
    type?: TransitionAnimation;
    transformOrigin?: React.CSSProperties["transformOrigin"];
    easing?: React.CSSProperties["animationTimingFunction"];
    duration?: number;
    delay?: number;
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

    componentDidMount(): void {
        this.scene.addNode(this);
    }

    componentDidUpdate(prevProps: SharedElementProps) {
        if (this.props.id !== prevProps.id) {
            this.scene.removeNode(prevProps.id.toString());
            this.scene.addNode(this);
        }
    }

    componentWillUnmount(): void {
        this.scene.removeNode(this.id);
    }

    get canTransition() {
        return Boolean(this.scene.previousScene?.nodes.has(this.id)) && !this.props.disabled && this.scene.canTransition;
    }

    get scene() {
        return this.context!;
    }

    get id() {
        return this.props.id.toString();
    }

    get transitionType() {
        return this.props.config?.type;
    }

    get animationEffect() {
        const startNode = this.scene.previousScene?.nodes.get(this.id)?.ref?.firstElementChild;
        const endNode = this.ref?.firstElementChild;
        console.log({ startNode, endNode });
        return new ParallelEffect([]);
    }

    setRef = (ref: HTMLDivElement | null) => {
        if (this.ref !== ref) {
            this.ref = ref;
            this.forceUpdate();
        }
    }
    
    render() {
        return (
            <div
                ref={this.setRef}
                id={`shared-element-${this.id}`}
            >
                {this.ref && createPortal(this.props.children, this.ref, this.id)}
            </div>
        );
    }
}