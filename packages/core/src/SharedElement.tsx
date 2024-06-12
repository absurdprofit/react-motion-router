import { Component, createRef } from 'react';
import { SharedElementTransitionType, WillChange } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';

interface SharedElementConfig {
    type?: SharedElementTransitionType;
    transformOrigin?: React.CSSProperties["transformOrigin"];
    easing?: React.CSSProperties["animationTimingFunction"];
    duration?: number;
    delay?: number;
    willChange?: WillChange[];
}

interface SharedElementProps {
    id: string;
    children: React.ReactElement;
    disabled?: boolean;
    config?: SharedElementConfig;
}

interface SharedElementState {}

export class SharedElement extends Component<SharedElementProps, SharedElementState> {
    public readonly ref = createRef<HTMLDivElement>();
    static readonly contextType = SharedElementSceneContext;
    declare context: React.ContextType<typeof SharedElementSceneContext>;

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

    get willChange(): WillChange[] {
        if (this.props.config?.willChange) {
            return this.props.config.willChange;
        }
        return [];
    }

    get canTransition() {
        return this.scene.previousScene?.nodes.has(this.id)
            && !this.props.disabled
            && this.scene.canTransition;
    }

    get scene() {
        return this.context;
    }

    get id() {
        return `shared-element-${this.props.id.toString()}`;
    }

    get transitionType(): SharedElementTransitionType {
        return this.props.config?.type ?? this.scene.previousScene?.nodes.get(this.id)?.transitionType ?? "morph";
    }

    getBoundingClientRect() {
        return this.ref.current?.firstElementChild?.getBoundingClientRect() ?? new DOMRect();
    }

    public clone() {
        if (!this.ref.current) return null;
        return this.ref.current.cloneNode(true) as HTMLDivElement;
    }

    public hide() {
        if (!this.ref.current) return;
        this.ref.current.style.visibility = 'hidden';
    }

    public unhide() {
        if (!this.ref.current) return;
        this.ref.current.style.visibility = 'visible';
    }

    render() {
        return (
            <div
                ref={this.ref}
                id={this.id}
                style={{display: "contents"}}
            >
                {this.props.children}
            </div>
        );
    }
}