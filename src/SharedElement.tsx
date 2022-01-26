import React, {createContext} from 'react';
import {get_css_text, clamp, Vec2} from './common/utils';

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

    type EasingFunction = EasingFunctionKeyword | string;

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
        transform_origin?: TransformOrigin;
        easing_function?: EasingFunction;
        duration?: number;
        animation?: TransitionAnimation;
        x?: {
            duration?: number;
            easing_function?: EasingFunction
        };
        y?: {
            duration?: number;
            easing_function?: EasingFunction
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
            computed_styles: CSSStyleDeclaration;
            client_rect: DOMRect;
        };
    }

    export interface NodeMap {
        [key:string]: SharedElementNode;
    }

    export class Scene {
        private _nodes: NodeMap = {};
        private _name: string = '';
        private _scroll_pos: Vec2 | null = null;
        constructor(name: string) {
            this._name = name;
        }
        add_node(node: SharedElementNode) {
            if (Object.keys(this.nodes).includes(node.id)) {
                console.assert(!Object.keys(this.nodes).includes(node.id), `Duplicate Shared Element ID: ${node.id} in ${this._name}`);
                throw new Error(`Duplicate Shared Element ID: '${node.id}' in Component: '${this._name}'`);
            }
            this._nodes[node.id] = node;
        }

        remove_node(node: SharedElementNode) {
            delete this._nodes[node.id];
        }

        get nodes(): NodeMap {
            return this._nodes;
        }

        get name(): string {
            return this._name;
        }
        
        get scroll_pos() {
            return this._scroll_pos || {
                x: 0,
                y: 0
            };
        }

        set scroll_pos(_scroll_pos: Vec2) {
            this._scroll_pos = _scroll_pos;
        }

        is_empty() {
            return !Object.keys(this._nodes).length ? true : false;
        }
    }

    export const SceneContext = createContext<Scene | null>(null);

    function node_from_ref(
        id: string,
        ref: Element,
        instance: SharedElement.SharedElement
    ): SharedElementNode {
        const node: HTMLElement = ref.cloneNode(true) as HTMLElement;
        const computed_style = instance.computed_style;
        const client_rect = instance.client_rect;
        (node.firstChild as HTMLElement).style.cssText = get_css_text(computed_style);

        if (instance.props.config && instance.props.config.transform_origin) {
            (node.firstChild as HTMLElement).style.transformOrigin = instance.props.config.transform_origin;
        }
        /**
         * Translate X on outer element and translate Y on inner element
         * allows for layered animations
         */
        (node.firstChild as HTMLElement).style.transform = `translateY(${clamp(client_rect.y, 0)}px)`;
        node.style.transform = `translateX(${clamp(client_rect.x, 0)}px)`;
        node.style.willChange = 'contents, transform';
        node.style.position = 'absolute';
        node.style.top = '0';
        node.style.left = '0';
        node.setAttribute('x', `${clamp(client_rect.x, 0)}px`);
        node.setAttribute('y', `${clamp(client_rect.y, 0)}px`);
 
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
        private _is_mounted: boolean = false;
        
        get scene() {
            return this._scene;
        }
        
        get client_rect() {
            if (this.ref && this.ref.firstChild) {
                return (this.ref.firstChild as Element).getBoundingClientRect();
            }
            return new DOMRect();
        }
    
        get computed_style() {
            if (this.ref && this.ref.firstChild) {
                const computed_styles = window.getComputedStyle((this.ref.firstChild as Element));
                
                return computed_styles;
            }
            return new CSSStyleDeclaration();
        }
    
        get css_text() {
            const computed_style = this.computed_style;
            if (computed_style) return get_css_text(computed_style);
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
            if (this._is_mounted) {
                this.forceUpdate();
            }
        }

        private set_ref(ref: HTMLDivElement | null) {
            if (this.ref !== ref) {
                if (this.ref) {
                    this.scene?.remove_node(node_from_ref(this._id, this.ref, this));
                }
                this.ref = ref;
                
                if (ref) {
                    this.scene?.add_node(node_from_ref(this._id, ref, this));
                }
            }
    
        }

        componentDidMount() {
            this._is_mounted = true;
        }
        componentDidUpdate() {
            if (this._id !== this.props.id) {
                if (this.ref) {
                    this.scene?.remove_node(node_from_ref(this._id, this.ref, this));
                    this._id = this.props.id.toString();
                    this.scene?.add_node(node_from_ref(this._id, this.ref, this));
                }
            }
        }
        componentWillUnmount() {
            this._is_mounted = false;
        }

        render() {
            return (
                <SceneContext.Consumer>
                    {(scene) => {
                        this._scene = scene;
                        return (
                            <div
                                ref={this.set_ref.bind(this)}
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