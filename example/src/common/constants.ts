import { AnimationEffectFactory } from "@react-motion-router/core";

export const STATIC_ANIMATION: AnimationEffectFactory = ({ref}) => new KeyframeEffect(ref, [], { duration: 0 });