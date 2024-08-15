import { AnimationEffectFactoryProps } from "@react-motion-router/core";
import { SlideInFromRightKeyframes, SlideOutToLeftKeyframes } from '@react-motion-router/stack';
import { isIOS, isPWA } from "./common/utils";

export function animation({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const duration = isIOS() && !isPWA() ? 0 : 300;
	const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: "both"
	};
	const keyframes = [
		SlideOutToLeftKeyframes,
		SlideInFromRightKeyframes
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}

export function slideToStatic({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const duration = isIOS() && !isPWA() ? 0 : 300;
	const options: KeyframeEffectOptions = {
		duration,
		direction,
		playbackRate,
		fill: "both"
	};
	const keyframes = [
		[],
		SlideInFromRightKeyframes
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}