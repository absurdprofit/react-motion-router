export const SlideInFromRightKeyframes: Keyframe[] = [
	{
		transform: 'translateX(100vw)',
	},
	{
		transform: 'translateX(0vw)'
	}
];

export const iOSSlideInFromRightKeyframes: Keyframe[] = [
	{
		transform: 'translateX(100vw)',
	},
	{
		transform: 'translateX(0vw)'
	}
];

export const SlideOutToLeftKeyframes: Keyframe[] = [
	{
		transform: 'translateX(0vw)'
	},
	{
		transform: 'translateX(-50vw)'
	}
];

export const iOSSlideOutToLeftKeyframes: Keyframe[] = [
	{
		transform: 'translateX(0vw)',
	},
	{
		transform: 'translateX(calc(100vw * -0.3))'
	}
];

export const SlideInFromLeftKeyframes: Keyframe[] = [
	{
		transform: 'translateX(-100vw)'
	},
	{
		transform: 'translateX(0vw)'
	}
];

export const iOSSlideInFromLeftKeyframes: Keyframe[] = [
	{
		transform: 'translateX(-100vw)'
	},
	{
		transform: 'translateX(0vw)'
	}
];

export const SlideOutToRightKeyframes: Keyframe[] = [
	{
		transform: 'translateX(0vw)'
	},
	{
		transform: 'translateX(50vw)'
	}
];

export const iOSSlideOutToRightKeyframes: Keyframe[] = [
	{
		transform: 'translateX(0vw)'
	},
	{
		transform: 'translateX(calc(100vw * 0.3))'
	}
];

export const SlideInFromBottomKeyframes: Keyframe[] = [
	{
		transform: 'translateY(100vh)'
	},
	{
		transform: 'translateY(0vh)'
	}
];

export const iOSSlideInFromBottomKeyframes: Keyframe[] = [
	{
		transform: 'translateY(100vh)'
	},
	{
		transform: 'translateY(0vh)'
	}
];

export const SlideOutToTopKeyframes: Keyframe[] = [
	{
		transform: 'translateY(0vh)'
	},
	{
		transform: 'translateY(-50vh)'
	}
];

export const SlideInFromTopKeyframes: Keyframe[] = [
	{
		transform: 'translateY(-100vh)'
	},
	{
		transform: 'translateY(0vh)'
	}
];

export const SlideOutToBottomKeyframes: Keyframe[] = [
	{
		transform: 'translateY(0vh)'
	},
	{
		transform: 'translateY(50vh)'
	}
];

export const ZoomInKeyframes: Keyframe[] = [
	{
		transform: 'scale(0.85)',
		opacity: 0
	},
	{
		transform: 'scale(1)',
		opacity: 1
	}
];

export const ZoomOutKeyframes: Keyframe[] = [
	{
		transform: 'scale(1)',
		opacity: 1
	},
	{
		transform: 'scale(1.15)',
		opacity: 0
	}
];

export const FadeInKeyframes: Keyframe[] = [
	{
		opacity: 0
	},
	{
		opacity: 1
	}
];

export const FadeOutKeyframes: Keyframe[] = [
	{
		opacity: 1
	},
	{
		opacity: 0
	}
];

export const androidFadeInFromBottomKeyframes: Keyframe[] = [
	{
		opacity: 0,
		transform: 'translateY(calc(100vh * 0.08))'
	},
	{
		opacity: 0.25,
		offset: 0.5
	},
	{
		opacity: 0.7,
		offset: 0.9
	},
	{
		opacity: 1,
		transform: 'translateY(0vh)'
	}
];

export const androidFadeInFromRightKeyframes: Keyframe[] = [
	{
		opacity: 0,
		transform: 'translateY(96vw)'
	},
	{
		opacity: 1,
		transform: 'translateY(0vw)'
	}
];

export const androidFadeOutToLeftKeyframes: Keyframe[] = [
	{
		opacity: 0,
		transform: 'translateY(0vw)'
	},
	{
		opacity: 1,
		transform: 'translateY(-96vw)'
	}
];

export const androidRevealFromBottomKeyframes: Keyframe[] = [
	{
		transform: 'translateY(100vh)'
	},
	{
		transform: 'translateY(calc(calc(100vh * calc(95.9 / 100)) * -1))'
	}
];

export const androidConcealToBottomKeyframes: Keyframe[] = [
	{
		transform: 'translateY(0vh)'
	},
	{
		transform: 'translateY(calc(calc(100vh * calc(2/ 100)) * -1))'
	}
];

export const androidScaleFromCentreKeyframes: Keyframe[] = [
	{
		transform: 'scale(0.85)',
		opacity: 0
	},
	{
		opacity: 0,
		offset: 0.75
	},
	{
		opacity: 1,
		offset: 0.875
	},
	{
		transform: 'scale(1)',
		opacity: 1
	}
];

export const androidScaleToCentreKeyframes: Keyframe[] = [
	{
		transform: 'scale(1)',
		opacity: 1
	},
	{
		opacity: 1,
		offset: 0.0825
	},
	{
		opacity: 1,
		offset: 0.2075
	},
	{
		transform: 'scale(1.075)',
		opacity: 0
	}
];

export const androidFadeInFromBottomSheetKeyframes: Keyframe[] = [
	{
		transform: 'translateY(calc(100vh * 0.8))',
		opacity: 0
	},
	{
		transform: 'translateY(0vh)',
		opacity: 1
	}
];