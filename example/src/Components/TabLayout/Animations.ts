import { AnimationConfigSet } from 'react-motion-router/common/types';

const TabAnimation: AnimationConfigSet = {
    in: {
        keyframes: [
            {transform: 'translateX(100%)'},
            {transform: 'translateX(0%)'}
        ],
        options: {
            duration: 200
        }
    },
    out: {
        keyframes: [
            {transform: 'translateX(0%)'},
            {transform: 'translateX(-100%)'}
        ],
        options: {
            duration: 200
        }
    }
}

export {TabAnimation};