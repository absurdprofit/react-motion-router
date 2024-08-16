import { Component, createRef } from 'react';
import { SharedElementTransitionType, StyleKeyList } from './common/types';
import { SharedElementSceneContext } from './SharedElementSceneContext';

interface SharedElementConfig extends OptionalEffectTiming {
    type?: SharedElementTransitionType;
    transformOrigin?: React.CSSProperties["transformOrigin"];
    styles?: StyleKeyList;
    deepClone?: boolean;
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

    get styles(): StyleKeyList {
        if (this.props.config?.styles) {
            return this.props.config.styles;
        }
        return [];
    }

    get canTransition() {
        return !this.props.disabled
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
        const deepClone = this.props.config?.deepClone ?? true;
        return this.ref.current.firstElementChild?.cloneNode(deepClone) as HTMLElement;
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