import { AnimationEffectFactoryProps } from '@react-motion-router/core';
import { isIOS, isPWA } from '../../common/utils';
import { ParallelEffect } from 'web-animations-extension';

export function BackdropAnimation({ ref, direction, playbackRate, index }: AnimationEffectFactoryProps) {
    const duration = isIOS() && !isPWA() ? 0 : 300;
    const options: KeyframeEffectOptions = {
        duration,
        direction,
        playbackRate,
        fill: direction === "normal" ? "forwards" : "backwards",
        pseudoElement: "::backdrop"
    };
    const fadeOut = [
        { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        { backgroundColor: 'rgba(0, 0, 0, 0)' }
    ];
    const fadeIn = [
        { backgroundColor: 'rgba(0, 0, 0, 0)' },
        { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
    ];
    const keyframes = [
        fadeOut,
        fadeIn
    ];

    return new KeyframeEffect(ref, keyframes[index], options);
};

export function HomeAnimation({ ref, direction, playbackRate, index }: AnimationEffectFactoryProps) {
    const duration = isIOS() && !isPWA() ? 0 : 300;
    const options: KeyframeEffectOptions = {
        duration,
        direction,
        playbackRate,
        fill: "both"
    };
    const scaleUp = [
        {
            transform: 'scale(0.95) translateY(15px)',
            borderRadius: '15px'
        },
        {
            transform: 'scale(1) translateY(0%)',
            borderRadius: '45px'
        }
    ];

    const scaleDown = [
        {
            transform: 'scale(1)  translateY(0%)',
            borderRadius: '45px'
        },
        {
            transform: 'scale(0.95) translateY(15px)',
            borderRadius: '15px'
        }
    ];

    const keyframes = [
        scaleDown,
        scaleUp
    ];

    return new KeyframeEffect(ref, keyframes[index], options);
}

export function ModalAnimation({ ref, direction, playbackRate, index, ...props }: AnimationEffectFactoryProps) {
    const duration = isIOS() && !isPWA() ? 0 : 300;
    const options: KeyframeEffectOptions = {
        duration,
        direction,
        playbackRate,
        fill: direction === "normal" ? "forwards" : "backwards"
    };

    const keyframes = [
        [
            { transform: 'translateY(15vh)', borderRadius: '15px 15px 0px 0px' },
            { transform: 'translateY(90vh)', borderRadius: '0px' }
        ],
        [
            { transform: 'translateY(90vh)', borderRadius: '0px' },
            { transform: 'translateY(15vh)', borderRadius: '15px 15px 0px 0px' }
        ]
    ];
    return new ParallelEffect([
        new KeyframeEffect(ref, keyframes[index], options),
        BackdropAnimation({ ref, direction, playbackRate, index, ...props })
    ]);
};
