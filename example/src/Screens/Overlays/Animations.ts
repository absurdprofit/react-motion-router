import { AnimationConfigFactory } from 'react-motion-router';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from '../../common/utils';

export const OverlaysAnimation: AnimationConfigFactory = (currentPath: string, nextPath: string) => {
    if (iOS() && !isPWA()) {
        return {
          type: 'none',
          duration: 0
        }
    }
    if ((matchRoute(currentPath, '/overlays') && matchRoute(nextPath, '/modal'))
    || (matchRoute(currentPath, '/modal') && matchRoute(nextPath, '/overlays'))) {
        return {
            in: {
                keyframes: [
                    {
                        transform: 'scale(0.95) translate(2.5vw, 2.5vh)',
                        borderRadius: '0px'
                    },
                    {
                        transform: 'scale(1) translate(0vw, 0vh)',
                        borderRadius: '15px'
                    }
                ],
                options: 350
            },
            out: {
                keyframes: [
                    {
                        transform: 'scale(1) translate(0vw, 0vh)',
                        borderRadius: '15px'
                    },
                    {
                        transform: 'scale(0.95) translate(2.5vw, 2.5vh)',
                        borderRadius: '0px'
                    }
                ],
                options: 350
            }
        }
    }
    return {
        type: 'slide',
        direction: 'right',
        duration: 350
    };
}