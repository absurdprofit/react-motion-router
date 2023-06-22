import React, { createContext } from 'react';
import { getCSSData } from './common/utils';
import { EasingFunction, PlainObject, Vec2 } from './common/types';


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
    private _nodes: SharedElementNodeMap = new Map<string, SharedElementNode>();
    private _name: string = '';
    private _scrollPos: Vec2 | null = null;
    private _x: number = 0;
    private _y: number = 0;
    private _xRatio: number = 0;
    private _yRatio: number = 0;
    private _keepAlive: boolean = false;

    constructor(name: string) {
        this._name = name;
    }
    addNode(node: SharedElementNode | null) {
        if (!node) return;
        console.assert(!this.nodes.has(node.id), `Duplicate Shared Element ID: ${node.id} in ${this._name}`);
        this._nodes.set(node.id, node);
    }

    removeNode(_id: string) {
        this._nodes.delete(_id);
    }

    get xRatio() {
        return this._xRatio;
    }

    get yRatio() {
        return this._yRatio;
    }

    get nodes(): SharedElementNodeMap {
        return this._nodes;
    }

    get name(): string {
        return this._name;
    }
    
    get scrollPos() {
        return this._scrollPos || {
            x: 0,
            y: 0
        };
    }

    get x() {
        return this._x;
    }
    
    get y() {
        return this._y;
    }

    get keepAlive() {
        return this._keepAlive;
    }

    set scrollPos(_scrollPos: Vec2) {
        this._scrollPos = _scrollPos;
    }

    set x(_x: number) {
        this._x = _x;
    }

    set y(_y: number) {
        this._y = _y;
    }

    set xRatio(_xRatio: number) {
        this._xRatio = _xRatio;
    }

    set yRatio(_yRatio: number) {
        this._yRatio = _yRatio;
    }
    
    set keepAlive(_keepAlive: boolean) {
        this._keepAlive = _keepAlive
    }

    isEmpty() {
        return !Boolean(this._nodes.size);
    }
}

export const SharedElementSceneContext = createContext<SharedElementScene | null>(null);

function nodeFromRef(
    id: string,
    _ref: Element,
    instance: SharedElement
): SharedElementNode | null {
    const node: HTMLElement = _ref.cloneNode(true) as HTMLElement;
    const firstChild = node.firstElementChild as HTMLElement | null;
    
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
    x?: {
        duration?: number;
        easingFunction?: EasingFunction
    };
    y?: {
        duration?: number;
        easingFunction?: EasingFunction
    };
}

interface SharedElementProps {
    id: string | number;
    children: React.ReactChild;
    config?: SharedElementConfig;
}

interface SharedElementState {
    hidden: boolean;
    keepAlive: boolean;
}

export class SharedElement extends React.Component<SharedElementProps, SharedElementState> {
    private _id : string = this.props.id.toString();
    private _ref: HTMLDivElement | null = null;
    private _scene: SharedElementScene | null = null;
    private _mutationObserver = new MutationObserver(this.updateScene.bind(this));
    private _callbackID: number = 0;
    private _computedStyle: CSSStyleDeclaration | null = null;
    private _isMounted = false;
    private onRef = this.setRef.bind(this);
    
    state: SharedElementState = {
        hidden: false,
        keepAlive: false
    }

    get scene() {
        return this._scene;
    }

    get node() {
        if (this._ref) return this._ref.cloneNode(true) as HTMLElement;
        else return null;
    }
    
    get clientRect() {
        if (this._ref && this._ref.firstElementChild) {
            const clientRect = this._ref.firstElementChild.getBoundingClientRect();
            return clientRect;
        }
        return new DOMRect();
    }

    get CSSData(): [string, PlainObject<string>] {
        const _computedStyle = this._computedStyle;
        if (_computedStyle) return getCSSData(_computedStyle);
        return ['', {}];
    }

    get CSSText(): string {
        const _computedStyle = this._computedStyle;
        if (_computedStyle) {
            const [CSSText] = getCSSData(_computedStyle, false);
            return CSSText;
        };
        return '';
    }

    get id() {
        return this._id;
    }

    get transitionType() {
        return this.props.config?.type;
    }

    keepAlive(_keepAlive: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.setState({keepAlive: _keepAlive}, () => resolve());
        });
    }

    hidden(_hidden: boolean): Promise<void> {
        return new Promise((resolve, _) => {
            if (this._isMounted) {
                this.setState({hidden: _hidden}, () => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    private setRef(_ref: HTMLDivElement | null) {
        if (this._ref !== _ref) {
            if (this._ref) {
                this.scene?.removeNode(this._id);
                this._mutationObserver.disconnect();
                this._computedStyle = null;
            }
            this._ref = _ref;
            
            if (_ref) {
                this.scene?.addNode(nodeFromRef(this._id, _ref, this));
                if (_ref.firstElementChild) {
                    this._computedStyle = window.getComputedStyle(_ref.firstElementChild);
                    this._mutationObserver.observe(_ref.firstElementChild, {
                        attributes: true,
                        childList: true,
                        subtree: true
                    });
                }
            }
        }

    }

    updateScene() {
        const cancelCallback = window.cancelIdleCallback ? window.cancelIdleCallback : window.clearTimeout;
        const requestCallback = window.requestIdleCallback ? window.requestIdleCallback : window.setTimeout;
        cancelCallback(this._callbackID);
        this._callbackID = requestCallback(() => {
            if (this._ref) {
                this.scene?.removeNode(this._id);
                this.scene?.addNode(nodeFromRef(this._id, this._ref, this));
            }
            this._callbackID = 0;
        });
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentDidUpdate() {
        if (this._id !== this.props.id.toString()) {
            if (this._ref) {
                this.scene?.removeNode(this._id);
                this._id = this.props.id.toString();
                this.scene?.addNode(nodeFromRef(this._id, this._ref, this));
            }
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }
    
    render() {
        return (
            <SharedElementSceneContext.Consumer>
                {(scene) => {
                    this._scene = scene;
                    return (
                        <div
                            ref={this.onRef}
                            id={`shared-element-${this._id}`}
                            style={{
                                display: this.state.hidden && !this.keepAlive ? 'block' : 'contents',
                                visibility: this.state.hidden ? 'hidden': 'visible'
                            }}
                        >
                            {this.props.children}
                        </div>
                    );
                }}
            </SharedElementSceneContext.Consumer>
        );
    }
}