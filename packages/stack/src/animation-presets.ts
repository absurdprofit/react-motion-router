import { AnimationEffectFactoryProps } from "@react-motion-router/core";
import { androidFadeInFromBottomOptions, androidFadeOutToBottomOptions, iOSKeyframeOptions } from "./keyframe-options-presets";
import { androidFadeInFromBottomKeyframes, iOSSlideInFromRightKeyframes, iOSSlideOutToLeftKeyframes } from "./keyframe-presets";

export function iOSSlideInFromRight({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const keyframes = [
		iOSSlideOutToLeftKeyframes,
		iOSSlideInFromRightKeyframes
	];

	const options = {
		direction,
		playbackRate,
		iOSKeyframeOptions
	};

	return new KeyframeEffect(ref, keyframes[index], options);
}

export function androidFadeInFromBottom({ref, direction, playbackRate}: AnimationEffectFactoryProps) {
	const options = {
		direction,
		playbackRate,
		androidFadeInFromBottomOptions
	};

	return new KeyframeEffect(ref, androidFadeInFromBottomKeyframes, options);
}