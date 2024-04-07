import { AnimationEffectFactoryProps, SlideInFromRight, SlideOutToLeft } from "@react-motion-router/core";

export function animation({ref, direction, playbackRate, index}: AnimationEffectFactoryProps) {
	const options = {
		duration: 300,
		direction,
		playbackRate,
		fill: direction === "normal" ? "forwards" : "backwards"
	};
	const keyframes = [
		SlideInFromRight,
		SlideOutToLeft
	];
	return new KeyframeEffect(ref, keyframes[index], options);
}