import { AnimationEffectFactoryProps, SlideInFromRight, SlideOutToLeft } from "@react-motion-router/core";
import { isIOS, isPWA } from "./common/utils";

export function animation({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const duration = isIOS() && !isPWA() ? 0 : 300;
	const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: direction === "normal" ? "forwards" : "backwards"
	};
	const keyframes = [
		SlideOutToLeft,
		SlideInFromRight
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}

export function slideToStatic({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const duration = isIOS() && !isPWA() ? 0 : 300;
	const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: direction === "normal" ? "forwards" : "backwards"
	};
	const keyframes = [
		[],
		SlideInFromRight
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}