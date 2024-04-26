import { Component, createContext, createRef } from 'react';
import { getCSSData } from './common/utils';
import { EasingFunction, PlainObject, SharedElementNode, SharedElementNodeMap, SharedElementTransitionType, TransformOrigin, Vec2 } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';
import { createPortal } from 'react-dom';

interface SharedElementConfig {
    type?: SharedElementTransitionType;
    transformOrigin?: React.CSSProperties["transformOrigin"];
    easing?: React.CSSProperties["animationTimingFunction"];
    duration?: number;
    delay?: number;
}

interface SharedElementProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
    config?: SharedElementConfig;
}

interface SharedElementState {
    clone: React.ReactPortal | null;
}

const transformKeys = ["transform", "top", "left", "right", "bottom"];
export class SharedElement extends Component<SharedElementProps, SharedElementState> {
    private ref: HTMLDivElement | null = null;
    private cloneContainer = createRef<HTMLDivElement>();
    static readonly contextType = SharedElementSceneContext;
    context!: React.ContextType<typeof SharedElementSceneContext>;

    state = {
        clone: null
    }

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
        return this.scene.previousScene?.nodes.has(this.id) && !this.props.disabled && this.scene.canTransition;
    }

    get scene() {
        return this.context!;
    }

    get id() {
        return `shared-element-${this.props.id.toString()}`;
    }

    get transitionType(): SharedElementTransitionType {
        return this.props.config?.type ?? this.scene.previousScene?.nodes.get(this.id)?.transitionType ?? "morph";
    }

    getBoundingClientRect() {
        return this.ref?.getBoundingClientRect() ?? new DOMRect();
    }

    public clone() {
        if (!this.ref) return null;
        return this.ref.cloneNode(true) as HTMLDivElement;
    }

    public hide() {
        if (!this.ref) return;
        this.ref.style.visibility = 'hidden';
    }

    public unhide() {
        if (!this.ref) return;
        this.ref.style.visibility = 'visible';
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
                {...this.props}
                ref={this.setRef}
                id={this.id}
            >
                {this.state.clone}
                {this.props.children}
            </div>
        );
    }
}