import { FadeOut, FadeIn, AnimationEffectFactoryProps } from "@react-motion-router/core";
import { isIOS, isPWA } from "example/src/common/utils";

export function SlidesAnimation({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
    const duration = isIOS() && !isPWA() ? 0 : 300;
    const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: direction === "normal" ? "forwards" : "backwards"
	};
    const keyframes = [
        FadeOut,
        FadeIn
    ];

    return new KeyframeEffect(ref, keyframes[index], options);
}