import { easingToLinear, springToLinear } from "web-animations-extension";

function easingOut(easing: (t: number) => number): (t: number) => number {
	return t => 1 - easing(1 - t);
}

function easingPoly(n: number): (t: number) => number {
	return (t: number) => Math.pow(t, n);
}

export const iOSKeyframeOptions: KeyframeEffectOptions = {
	...springToLinear({
		mass: 3,
		stiffness: 1000,
		damping: 500,
		velocity: 0,
		steps: 200
	})
};

export const androidFadeInFromBottomOptions: KeyframeAnimationOptions = {
	duration: 350,
	easing: easingToLinear(easingOut(easingPoly(5)))
};

export const androidFadeOutToBottomOptions: KeyframeAnimationOptions = {
	duration: 150,
	easing: 'linear'
};

export const androidRevealFromBottomOptions: KeyframeAnimationOptions = {
	duration: 425,
	easing: 'cubic-bezier(0.35, 0.45, 0, 1)'
};

export const androidScaleFromCentreOptions: KeyframeAnimationOptions = {
	duration: 400,
	easing: 'cubic-bezier(0.35, 0.45, 0, 1)'
};

export const androidBottomSheetSlideInOptions: KeyframeAnimationOptions = {
	duration: 250,
	easing: easingToLinear(t => Math.cos((t + 1) * Math.PI) / 2.0 + 0.5)
};

export const androidBottomSheetSlideOutOptions: KeyframeAnimationOptions = {
	duration: 200,
	easing: easingToLinear(t => (t === 1.0 ? 1 : Math.pow(t, 2)))
};