import { Component, createRef } from 'react';
import { SharedElementTransitionType } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';

interface SharedElementConfig {
    type?: SharedElementTransitionType;
    transformOrigin?: React.CSSProperties["transformOrigin"];
    easing?: React.CSSProperties["animationTimingFunction"];
    duration?: number;
    delay?: number;
}

interface SharedElementProps {
    id: string;
    children: React.ReactElement;
    disabled?: boolean;
    config?: SharedElementConfig;
}

interface SharedElementState {}

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
        return this.scene.previousScene?.nodes.has(this.id)
            && !this.props.disabled
            && this.scene.canTransition;
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
        return this.ref?.firstElementChild?.getBoundingClientRect() ?? new DOMRect();
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
        this.ref = ref;
    }
    
    render() {
        return (
            <div
                ref={this.setRef}
                id={this.id}
                style={{display: "contents"}}
            >
                {this.props.children}
            </div>
        );
    }
}