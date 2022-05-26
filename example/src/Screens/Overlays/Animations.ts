import { AnimationConfigFactory } from 'react-motion-router';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from '../../common/utils';

export const OverlaysAnimation: AnimationConfigFactory = (currentPath: string, nextPath: string) => {
    if ((matchRoute(currentPath, '/overlays') && matchRoute(nextPath, '/modal'))
    || (matchRoute(currentPath, '/modal') && matchRoute(nextPath, '/overlays'))) {
        return {
            in: {
                keyframes: [
                    {
                        transform: 'scale(0.95)',
                        borderRadius: '15px'
                    },
                    {
                        transform: 'scale(1)',
                        borderRadius: '0px'
                    }
                ],
                options: 350
            },
            out: {
                keyframes: [
                    {
                        transform: 'scale(1)',
                        borderRadius: '0px'
                    },
                    {
                        transform: 'scale(0.95)',
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