import { AnimationEffectFactoryProps } from "@react-motion-router/core";
import { androidBottomSheetSlideInOptions, androidBottomSheetSlideOutOptions, androidFadeInFromBottomOptions, androidFadeOutToBottomOptions, androidRevealFromBottomOptions, androidScaleFromCentreOptions, iOSKeyframeOptions } from "./keyframe-options-presets";
import { androidConcealToBottomKeyframes, androidFadeInFromBottomKeyframes, androidFadeInFromBottomSheetKeyframes, androidFadeInFromRightKeyframes, androidFadeOutToLeftKeyframes, androidRevealFromBottomKeyframes, androidScaleFromCentreKeyframes, androidScaleToCentreKeyframes, iOSSlideInFromBottomKeyframes, iOSSlideInFromLeftKeyframes, iOSSlideInFromRightKeyframes, iOSSlideOutToLeftKeyframes, iOSSlideOutToRightKeyframes } from "./keyframe-presets";

export function iOSSlideInFromRight({ ref, direction, playbackRate, index }: AnimationEffectFactoryProps) {
	const keyframesPresets = [
		iOSSlideOutToLeftKeyframes,
		iOSSlideInFromRightKeyframes
	];

	let keyframes = keyframesPresets[index];
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...iOSKeyframeOptions
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function iOSSlideInFromLeft({ ref, direction, playbackRate, index }: AnimationEffectFactoryProps) {
	const keyframesPresets = [
		iOSSlideOutToRightKeyframes,
		iOSSlideInFromLeftKeyframes
	];

	let keyframes = keyframesPresets[index];
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...iOSKeyframeOptions
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function iOSSlideInFromBottom({ ref, direction, playbackRate }: AnimationEffectFactoryProps) {
	let keyframes = iOSSlideInFromBottomKeyframes;
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...iOSKeyframeOptions
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function androidFadeInFromBottom({ ref, direction, playbackRate }: AnimationEffectFactoryProps) {
	let keyframes = androidFadeInFromBottomKeyframes;
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...androidFadeInFromBottomOptions
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function androidFadeInFromBottomSheet({ ref, direction, index, playbackRate }: AnimationEffectFactoryProps) {
	let keyframes = androidFadeInFromBottomSheetKeyframes;
	let timing;
	if (index === 0)
		timing = androidBottomSheetSlideOutOptions;
	else
		timing = androidBottomSheetSlideInOptions;
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...timing
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function androidRevealFromBottom({ ref, direction, index, playbackRate }: AnimationEffectFactoryProps) {
	let keyframesPresets = [
		androidConcealToBottomKeyframes,
		androidRevealFromBottomKeyframes
	];

	const keyframes = keyframesPresets[index];
	const options: KeyframeEffectOptions = {
		direction,
		playbackRate,
		fill: "forwards" as const,
		...androidRevealFromBottomOptions
	};

	return new KeyframeEffect(ref, keyframes, options);
}

export function androidFadeInFromRight({ ref, direction, index, playbackRate }: AnimationEffectFactoryProps) {
	let keyframesPresets = [
		androidFadeOutToLeftKeyframes,
		androidFadeInFromRightKeyframes
	];
	let timing;
	if (index === 0)
		timing = androidFadeOutToBottomOptions;
	else
		timing = androidFadeInFromBottomOptions;

	let keyframes = keyframesPresets[index];
	const options: KeyframeEffectOptions = {
		playbackRate,
		fill: "forwards" as const,
		...timing
	};

	if (direction === "reverse")
		keyframes = keyframes.toReversed();

	return new KeyframeEffect(ref, keyframes, options);
}

export function androidScaleFromCentre({ ref, direction, index, playbackRate }: AnimationEffectFactoryProps) {
	let keyframesPresets = [
		androidScaleToCentreKeyframes,
		androidScaleFromCentreKeyframes
	];

	const keyframes = keyframesPresets[index];
	const options: KeyframeEffectOptions = {
		direction,
		playbackRate,
		fill: "forwards" as const,
		...androidScaleFromCentreOptions
	};

	return new KeyframeEffect(ref, keyframes, options);
}