import React, {createContext} from 'react';
import {getCssText, clamp, Vec2} from './common/utils';

namespace SharedElement {
    interface SharedElementNode {
        id: string;
        node: HTMLElement;
        instance: SharedElement;
    }

    //https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin#formal_syntax
    //https://stackoverflow.com/questions/51445767/how-to-define-a-regex-matched-string-type-in-typescript
    enum TransformOriginKeywordEnum {
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

    enum EasingFunctionKeywordEnum {
        "ease",
        "ease-in",
        "ease-in-out",
        "ease-out"
    }

    enum TransitionAnimationEnum {
        "morph",
        "fade-in",
        "fade-out",
        "cross-fade"
    }

    type TransitionAnimation = keyof typeof TransitionAnimationEnum;

    type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;

    export type EasingFunction = EasingFunctionKeyword | string;

    type TransformOriginGlobal = keyof typeof TransformOriginGlobalEnum;

    type TransformOriginLengthUnit = keyof typeof TransformOriginLengthUnitEnum;
    //e.g. 20px, 20%, 20rem
    type TransformOriginLength = `${number}${TransformOriginLengthUnit}` | 0;

    type TransformOriginKeyword = keyof typeof TransformOriginKeywordEnum;
    type OneValueTransformOrigin = TransformOriginKeyword | TransformOriginLength;
    type TwoValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin}`;
    type ThreeValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin} ${TransformOriginLength}`;
    type TransformOrigin = TransformOriginGlobal | OneValueTransformOrigin | TwoValueTransformOrigin | ThreeValueTransformOrigin;
    
    
    interface SharedElementConfig {
        type?: TransitionAnimation;
        transformOrigin?: TransformOrigin;
        easingFunction?: EasingFunction;
        duration?: number;
        animation?: TransitionAnimation;
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
    
    export interface Map {
        [key:string]: {
            node: Node;
            computedStyles: CSSStyleDeclaration;
            clientRect: DOMRect;
        };
    }

    export interface NodeMap {
        [key:string]: SharedElementNode;
    }

    export class Scene {
        private _nodes: NodeMap = {};
        private _name: string = '';
        private _scrollPos: Vec2 | null = null;
        private _x: number = 0;
        private _y: number = 0;

        constructor(name: string) {
            this._name = name;
        }
        addNode(node: SharedElementNode) {
            if (Object.keys(this.nodes).includes(node.id)) {
                console.assert(!Object.keys(this.nodes).includes(node.id), `Duplicate Shared Element ID: ${node.id} in ${this._name}`);
                throw new Error(`Duplicate Shared Element ID: '${node.id}' in Component: '${this._name}'`);
            }
            this._nodes[node.id] = node;
        }

        removeNode(node: SharedElementNode) {
            delete this._nodes[node.id];
        }

        get nodes(): NodeMap {
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

        set scrollPos(_scrollPos: Vec2) {
            this._scrollPos = _scrollPos;
        }

        set x(_x: number) {
            this._x = _x;
        }

        set y(_y: number) {
            this._y = _y;
        }

        isEmpty() {
            return !Object.keys(this._nodes).length ? true : false;
        }
    }

    export const SceneContext = createContext<Scene | null>(null);

    function nodeFromRef(
        id: string,
        ref: Element,
        instance: SharedElement.SharedElement
    ): SharedElementNode {
        const node: HTMLElement = ref.cloneNode(true) as HTMLElement;
        const computedStyle = instance.computedStyle;
        const clientRect = instance.clientRect;
        (node.firstChild as HTMLElement).style.cssText = getCssText(computedStyle);

        if (instance.props.config && instance.props.config.transformOrigin) {
            (node.firstChild as HTMLElement).style.transformOrigin = instance.props.config.transformOrigin;
        }
        /**
         * Translate X on outer element and translate Y on inner element
         * allows for layered animations
         */
        (node.firstChild as HTMLElement).style.transform = `translateY(${clientRect.y}px)`;
        node.style.transform = `translateX(${clientRect.x}px)`;
        node.style.willChange = 'contents, transform';
        node.style.position = 'absolute';
        node.style.top = '0';
        node.style.left = '0';
        node.setAttribute('x', `${clientRect.x}px`);
        node.setAttribute('y', `${clientRect.y}px`);
 
        /**
         * TODO:
         * i.e. if slide is horizontal (left|right) change to translateY or if slide is vertical (up|down) change to translateX
         * 
         * 2̶.̶ C̶o̶m̶p̶e̶n̶s̶a̶t̶e̶ f̶o̶r̶ t̶r̶a̶v̶e̶l̶ d̶i̶s̶t̶a̶n̶c̶e̶ d̶u̶e̶ t̶o̶ w̶i̶n̶d̶o̶w̶ s̶c̶r̶o̶l̶l̶ p̶o̶s̶i̶t̶i̶o̶n̶
         */
        return {
            id: id,
            node: node,
            instance: instance
        };
    }
    export class SharedElement extends React.Component<SharedElementProps> {
        private _id : string = this.props.id.toString();
        private ref: HTMLDivElement | null = null;
        private _scene: Scene | null = null;
        private _hidden: boolean = false;
        private _isMounted: boolean = false;
        private onRef = this.setRef.bind(this);
        
        get scene() {
            return this._scene;
        }
        
        get clientRect() {
            if (this.ref && this.ref.firstChild) {
                const clientRect = (this.ref.firstChild as Element).getBoundingClientRect();
                return clientRect;
            }
            return new DOMRect();
        }
    
        get computedStyle() {
            if (this.ref && this.ref.firstChild) {
                const computedStyles = window.getComputedStyle((this.ref.firstChild as Element));
                
                return computedStyles;
            }
            return new CSSStyleDeclaration();
        }
    
        get cssText() {
            const computedStyle = this.computedStyle;
            if (computedStyle) return getCssText(computedStyle);
            return '';
        }
    
        get id() {
            return this._id;
        }

        get hidden() {
            return this._hidden;
        }

        get transitionType() {
            return this.props.config?.type || 'morph';
        }

        set hidden(_hidden: boolean) {
            this._hidden = _hidden;
            if (this._isMounted) {
                this.forceUpdate();
            }
        }

        private setRef(ref: HTMLDivElement | null) {
            if (this.ref !== ref) {
                if (this.ref) {
                    this.scene?.removeNode(nodeFromRef(this._id, this.ref, this));
                }
                this.ref = ref;
                
                if (ref) {
                    this.scene?.addNode(nodeFromRef(this._id, ref, this));
                }
            }
    
        }

        componentDidMount() {
            this._isMounted = true;
        }
        componentDidUpdate() {
            if (this._id !== this.props.id) {
                if (this.ref) {
                    this.scene?.removeNode(nodeFromRef(this._id, this.ref, this));
                    this._id = this.props.id.toString();
                    this.scene?.addNode(nodeFromRef(this._id, this.ref, this));
                }
            }
        }
        componentWillUnmount() {
            this._isMounted = false;
        }

        render() {
            return (
                <SceneContext.Consumer>
                    {(scene) => {
                        this._scene = scene;
                        return (
                            <div
                                ref={this.onRef}
                                id={`shared-element-${this._id}`}
                                className={"shared-element"}
                                style={{
                                    display: this._hidden ? 'block' : 'contents',
                                    opacity: this._hidden ? '0': '1'
                                }
                            }>
                                {this.props.children}
                            </div>
                        );
                    }}
                </SceneContext.Consumer>
            );
        }
    }
}


export default SharedElement;