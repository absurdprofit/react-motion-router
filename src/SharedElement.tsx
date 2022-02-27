import React, {createContext} from 'react';
import {getCSSData, Vec2} from './common/utils';
import assert from 'assert';

namespace SharedElement {
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
        "fade-through",
        "fade",
        "cross-fade"
    }

    type TransitionAnimation = keyof typeof TransitionAnimationEnum;

    type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;

    export type EasingFunction = EasingFunctionKeyword | `cubic-bezier(${number},${' ' | ''}${number},${' ' | ''}${number},${' ' | ''}${number})`;

    type TransformOriginGlobal = keyof typeof TransformOriginGlobalEnum;

    type TransformOriginLengthUnit = keyof typeof TransformOriginLengthUnitEnum;
    //e.g. 20px, 20%, 20rem
    type TransformOriginLength = `${number}${TransformOriginLengthUnit}` | 0;

    type TransformOriginKeyword = keyof typeof TransformOriginKeywordEnum;
    type OneValueTransformOrigin = TransformOriginKeyword | TransformOriginLength;
    type TwoValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin}`;
    type ThreeValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin} ${TransformOriginLength}`;
    type TransformOrigin = TransformOriginGlobal | OneValueTransformOrigin | TwoValueTransformOrigin | ThreeValueTransformOrigin;

    interface SharedElementNode {
        id: string;
        node: HTMLElement;
        instance: SharedElement;
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
        addNode(node: SharedElementNode | null) {
            if (!node) return;
            assert(!Object.keys(this.nodes).includes(node.id), `Duplicate Shared Element ID: ${node.id} in ${this._name}`);
            this._nodes[node.id] = node;
        }

        removeNode(_id: string) {
            delete this._nodes[_id];
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
    ): SharedElementNode | null {
        const node: HTMLElement = ref.cloneNode(true) as HTMLElement;
        const firstChild = node.firstElementChild as HTMLElement | null;
        
        if (!firstChild) return null;

        if (instance.props.config && instance.props.config.transformOrigin) {
            firstChild.style.transformOrigin = instance.props.config.transformOrigin;
        }
 
        return {
            id: id,
            node: node,
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

    export class SharedElement extends React.Component<SharedElementProps> {
        private _id : string = this.props.id.toString();
        private ref: HTMLDivElement | null = null;
        private _scene: Scene | null = null;
        private _hidden: boolean = false;
        private _isMounted: boolean = false;
        private _mutationObserver = new MutationObserver(this.onMutation.bind(this));
        private onRef = this.setRef.bind(this);
        
        get scene() {
            return this._scene;
        }
        
        get clientRect() {
            if (this.ref && this.ref.firstElementChild) {
                const clientRect = this.ref.firstElementChild.getBoundingClientRect();
                return clientRect;
            }
            return new DOMRect();
        }
    
        get computedStyle() {
            if (this.ref && this.ref.firstChild) {
                const computedStyles = window.getComputedStyle((this.ref.firstChild as Element));
                
                return computedStyles;
            }
        }
    
        get getCSSData(): [string, {[key:string]:string}] {
            const computedStyle = this.computedStyle;
            if (computedStyle) return getCSSData(computedStyle);
            return ['', {}];
        }
    
        get id() {
            return this._id;
        }

        get hidden() {
            return this._hidden;
        }

        get transitionType() {
            return this.props.config?.type;
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
                    this.scene?.removeNode(this._id);
                    this._mutationObserver.disconnect();
                }
                this.ref = ref;
                
                if (ref) {
                    this.scene?.addNode(nodeFromRef(this._id, ref, this));
                    if (ref.firstElementChild) {
                        this._mutationObserver.observe(ref.firstElementChild, {
                            attributes: true,
                            childList: true,
                            subtree: true
                        });
                    }
                }
            }
    
        }

        onMutation() {
            this.updateScene();
        }

        updateScene() {
            queueMicrotask(() => {
                if (this.ref) {
                    this.scene?.removeNode(this._id);
                    this.scene?.addNode(nodeFromRef(this._id, this.ref, this));
                }
            });
        }

        componentDidMount() {
            this._isMounted = true;
        }
        
        componentDidUpdate() {
            if (this._id !== this.props.id.toString()) {
                if (this.ref) {
                    this.scene?.removeNode(this._id);
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
                                style={{
                                    display: this._hidden ? 'block' : 'contents',
                                    visibility: this._hidden ? 'hidden': 'visible'
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