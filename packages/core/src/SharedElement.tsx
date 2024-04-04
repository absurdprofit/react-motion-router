import { Component, createContext } from 'react';
import { getCSSData } from './common/utils';
import { EasingFunction, NodeAppendedEvent, PlainObject, Vec2 } from './common/types';


//https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin#formal_syntax
//https://stackoverflow.com/questions/51445767/how-to-define-a-regex-matched-string-type-in-typescript
enum TransformOriginKeywordEnum {
    center,
    top,
    bottom,
    left,
    right,
};

enum TransformOriginLengthUnitEnum {
    cap, ch, em, ex, ic, lh, rem, rlh, //relative length
    vh, vw, vi, vb, vmin, vmax,       //viewport percentage length
    px, cm, mm, Q, in, pc, pt,       //absolute length
    '%'
}

enum TransformOriginGlobalEnum {
    inital,
    inherit,
    revert,
    unset
}

enum TransitionAnimationEnum {
    "morph",
    "fade-through",
    "fade",
    "cross-fade"
}

type TransitionAnimation = keyof typeof TransitionAnimationEnum;

type TransformOriginGlobal = keyof typeof TransformOriginGlobalEnum;

type TransformOriginLengthUnit = keyof typeof TransformOriginLengthUnitEnum;
//e.g. 20px, 20%, 20rem
type TransformOriginLength = `${number}${TransformOriginLengthUnit}` | 0;

type TransformOriginKeyword = keyof typeof TransformOriginKeywordEnum;
type OneValueTransformOrigin = TransformOriginKeyword | TransformOriginLength;
type TwoValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin}`;
type ThreeValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin} ${TransformOriginLength}`;
type TransformOrigin = TransformOriginGlobal | OneValueTransformOrigin | TwoValueTransformOrigin | ThreeValueTransformOrigin;

export interface SharedElementNode {
    id: string;
    instance: SharedElement;
}

export type SharedElementNodeMap = Map<string, SharedElementNode>;

export class SharedElementScene {
    public readonly id: string;
    public readonly nodes: SharedElementNodeMap = new Map<string, SharedElementNode>();
    public scrollPos: Vec2 | null = {
        x: 0,
        y: 0
    };
    public getScreenRect: () => DOMRect = () => new DOMRect();
    public keepAlive: boolean = false;
    public previousScene: SharedElementScene | null = null;
    public canTransition: boolean = true; // should be false if page animation already started

    constructor(id: string) {
        this.id = id;
    }

    addNode(node: SharedElementNode | null) {
        if (!node) return;
        console.assert(!this.nodes.has(node.id), `Duplicate Shared Element ID: ${node.id} in ${this.id}`);
        this.nodes.set(node.id, node);
    }

    removeNode(_id: string) {
        this.nodes.delete(_id);
    }

    get xRatio() {
        const screenRect = this.getScreenRect();
        const xRatio = (screenRect.width / window.innerWidth).toFixed(2);
        return parseFloat(xRatio);
    }

    get yRatio() {
        const screenRect = this.getScreenRect();
        const yRatio = (screenRect.height / window.innerHeight).toFixed(2);
        return parseFloat(yRatio);
    }

    get x() {
        return this.getScreenRect().x;
    }
    
    get y() {
        return this.getScreenRect().y;
    }

    isEmpty() {
        return !Boolean(this.nodes.size);
    }
}

export const SharedElementSceneContext = createContext<SharedElementScene | null>(null);

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

interface SharedElementState {
    hidden: boolean;
    keepAlive: boolean;
}

const transformKeys = ["transform", "top", "left", "right", "bottom"];
export class SharedElement extends Component<SharedElementProps, SharedElementState> {
    private _ref: HTMLDivElement | null = null;
    private _computedStyle: CSSStyleDeclaration | null = null;
    static readonly contextType = SharedElementSceneContext;
    context!: React.ContextType<typeof SharedElementSceneContext>;

    state: SharedElementState = {
        hidden:  this.canTransition,
        keepAlive: false
    }

    get canTransition() {
        return Boolean(this.scene?.previousScene?.nodes.has(this.id)) && this.scene.canTransition;
    }

    get scene() {
        return this.context!;
    }

    get node() {
        if (this._ref) {
            if (
                this._ref.firstElementChild instanceof HTMLVideoElement
                && (this.transitionType ?? "morph") === "morph"
            ) {
                return this._ref;
            }
            return this._ref.cloneNode(true) as HTMLElement;
        }
        else return null;
    }
    
    get rect() {
        if (this._ref && this._ref.firstElementChild) {
            const clientRect = this._ref.firstElementChild.getBoundingClientRect();
            return clientRect;
        }
        return new DOMRect();
    }

    get CSSData(): [string, PlainObject<string>] {
        const _computedStyle = this._computedStyle;
        if (_computedStyle) return getCSSData(_computedStyle, transformKeys);
        return ['', {}];
    }

    get CSSText(): string {
        const _computedStyle = this._computedStyle;
        if (_computedStyle) {
            const [CSSText] = getCSSData(_computedStyle, transformKeys, false);
            return CSSText;
        };
        return '';
    }

    get id() {
        return this.props.id.toString();
    }

    get transitionType() {
        return this.props.config?.type;
    }

    onCloneAppended = (e: HTMLElement) => {}

    onCloneRemove = (e: HTMLElement) => {
        if (this._ref?.firstElementChild instanceof HTMLVideoElement) {
            const node = e.firstElementChild as HTMLVideoElement;
            this._ref.firstElementChild.currentTime = node.currentTime;
            if (!node.paused) {
                node.pause();
            }
        }
    }

    keepAlive(keepAlive: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.setState({keepAlive}, resolve);
        });
    }

    hidden(hidden: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.setState({hidden}, resolve);
        });
    }

    private onRef = (_ref: HTMLDivElement | null) => {
        if (this._ref !== _ref) {
            if (this._ref) {
                this.scene?.removeNode(this.id);
                this._computedStyle = null;
            }
            this._ref = _ref;
            
            if (_ref && !this.props.disabled) {
                this.scene?.addNode(nodeFromRef(this.id, _ref, this));
                if (_ref.firstElementChild) {
                    this._computedStyle = window.getComputedStyle(_ref.firstElementChild);
                }
            }
        }

    }

    componentDidUpdate() {
        if (this.props.disabled && this.scene?.nodes.has(this.id)) {
            this.scene.removeNode(this.id);
        }
    }

    render() {
        return (
            <div
                ref={this.onRef}
                id={`shared-element-${this.id}`}
                style={{
                    display: this.state.hidden && !this.keepAlive ? 'block' : 'contents',
                    visibility: this.state.hidden ? 'hidden': 'inherit'
                }}
            >
                {this.props.children}
            </div>
        );
    }
}