import {Stack} from '../Stack';
import _SharedElement from '../SharedElement';

const SharedElement = _SharedElement.SharedElement;
export type ScreenChild = React.ReactElement<React.ComponentProps<typeof Stack.Screen>,React.JSXElementConstructor<typeof Stack.Screen>>;

enum AnimationDirectionEnum {
    up,
    down,
    left,
    right,
    in,
    out
}

enum AnimationTypeEnum {
    slide,
    fade,
    zoom,
    none
}

export type ParamsSerialiser = (params: {[key:string]: any}) => string;
export type ParamsDeserialiser = (queryString: string) => {[key:string]: any};

export type AnimationType = keyof typeof AnimationTypeEnum;
export type AnimationDirection = keyof typeof AnimationDirectionEnum;
export interface AnimationConfig {
    type: AnimationType;
    direction?: AnimationDirection;
    duration: number;
}

export type AnimationConfigFactory = (currentPath: string, nextPath: string)=> AnimationConfig | {
    in: AnimationConfig;
    out?: AnimationConfig;
};

export {SharedElement};