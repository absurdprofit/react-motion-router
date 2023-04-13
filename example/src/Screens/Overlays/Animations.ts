import { matchRoute, AnimationConfigFactory, AnimationConfig } from '@react-motion-router/core';
import { iOS, isPWA } from '../../common/utils';

export const OverlaysAnimation: AnimationConfigFactory = (currentPath: string, nextPath: string) => {
    if ((matchRoute(currentPath, '/overlays') && matchRoute(nextPath, '/modal'))
        || (matchRoute(currentPath, '/modal') && matchRoute(nextPath, '/overlays'))) {
        return {
            in: {
                keyframes: [
                    {
                        transform: 'scale(0.95) translateY(15px)',
                        borderRadius: '15px'
                    },
                    {
                        transform: 'scale(1) translateY(0%)',
                        borderRadius: '45px'
                    }
                ],
                options: 350
            },
            out: {
                keyframes: [
                    {
                        transform: 'scale(1)  translateY(0%)',
                        borderRadius: '45px'
                    },
                    {
                        transform: 'scale(0.95) translateY(15px)',
                        borderRadius: '15px'
                    }
                ],
                options: 350
            }
        }
    }

    if (iOS() && !isPWA()) {
        return {
          type: 'none',
          duration: 0
        }
    } else {
        return {
            type: 'slide',
            direction: 'right',
            duration: 350
        };
    }
}

export const ModalAnimation: AnimationConfigFactory = (c, n, gestureNavigating) => {
    const fadeIn = {
        keyframes: [
            {backgroundColor: 'rgba(0, 0, 0, 0)'},
            {backgroundColor: 'rgba(0, 0, 0, 0.3)'}
        ],
        options: {
            duration: 150,
        }
    };
    const fadeOut = {
        keyframes: [
            {backgroundColor: 'rgba(0, 0, 0, 0.3)'},
            {backgroundColor: 'rgba(0, 0, 0, 0)'}
        ],
        options: {
            duration: 250,
        }
    };
    
    return {
        in: fadeIn,
        out: fadeOut
    }
};