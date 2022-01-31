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
        "move",
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

        set scrollPos(_scrollPos: Vec2) {
            this._scrollPos = _scrollPos;
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
        (node.firstChild as HTMLElement).style.transform = `translateY(${clamp(clientRect.y, 0)}px)`;
        node.style.transform = `translateX(${clamp(clientRect.x, 0)}px)`;
        node.style.willChange = 'contents, transform';
        node.style.position = 'absolute';
        node.style.top = '0';
        node.style.left = '0';
        node.setAttribute('x', `${clamp(clientRect.x, 0)}px`);
        node.setAttribute('y', `${clamp(clientRect.y, 0)}px`);
 
        /**
         * TODO:
         * 1. If animation type is slide change translate to either translateX or translateY depending on the slide direction
         * i.e. if slide is horizontal (left|right) change to translateY or if slide is vertical (up|down) change to translateX
         * 
         * 2. Compensate for travel distance due to window scroll position
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
        
        get scene() {
            return this._scene;
        }
        
        get clientRect() {
            if (this.ref && this.ref.firstChild) {
                return (this.ref.firstChild as Element).getBoundingClientRect();
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
                                ref={this.setRef.bind(this)}
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