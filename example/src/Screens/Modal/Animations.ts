import { AnimationConfigFactory, AnimationConfig } from 'react-motion-router/common/types';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from '../../common/utils';

export const ModalAnimation: AnimationConfigFactory = (c, n, gestureNavigating) => {
    const slideDefaultAnimation: AnimationConfig = {
        type: 'slide',
        direction: 'right',
        duration: 350
    };
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
    if (matchRoute(n, '/')) return slideDefaultAnimation;
    if (iOS() && !isPWA()) {
        return {
          type: 'none',
          duration: 0
        }
    }
    return {
        in: fadeIn,
        out: fadeOut
    }
};