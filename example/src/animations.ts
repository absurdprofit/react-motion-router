import { AnimationFactoryProps, getAnimationFromKeyframes, SlideInFromRight, SlideOutToLeft } from "@react-motion-router/core";
import { iOS, isPWA } from "./common/utils";

export function AppInAnimation(props: AnimationFactoryProps) {
    if ((iOS() && !isPWA())) {
        return getAnimationFromKeyframes([], {duration: 350}, props);
    }
    return getAnimationFromKeyframes(SlideInFromRight, {duration: 350}, props);
}

export function AppOutAnimation(props: AnimationFactoryProps) {
    if ((iOS() && !isPWA())) {
        return getAnimationFromKeyframes([], {duration: 350}, props);
    }
    return getAnimationFromKeyframes(SlideOutToLeft, {duration: 350}, props);
}

export default {in: AppInAnimation, out: AppOutAnimation};