import { AnimationEffectFactoryProps } from "@react-motion-router/core";
import { SlideInFromRight, SlideOutToLeft } from '@react-motion-router/stack';
import { isIOS, isPWA } from "./common/utils";

export function animation({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const duration = isIOS() && !isPWA() ? 0 : 300;
	const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: "forwards"
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
		fill: "forwards"
	};
	const keyframes = [
		[],
		SlideInFromRight
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}