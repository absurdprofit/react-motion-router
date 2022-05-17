import React from 'react';
import { Navigation } from 'react-motion-router';
import '../css/Modal.css';
import { ClickAwayListener } from '@mui/material';
import { createSpringAnimation } from 'springframes';
import { AnimationConfigFactory, AnimationConfig, AnimationKeyframeEffectConfig } from 'react-motion-router/common/types';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from '../common/utils';

interface ModalScreenProps {
    navigation: Navigation;
}

const inAnimation = createSpringAnimation({
    dx: 0,
    dy: 10,
    stiffness: 100,
    mass: 2,
    damping: 50,
});

export const ModalAnimation: AnimationConfigFactory = (c, n, gestureNavigating) => {
    const slideDefaultAnimation: AnimationConfig = {
        type: 'slide',
        direction: 'up',
        duration: 350
    };
    const springAnimation: AnimationKeyframeEffectConfig = {
        keyframes: [
            {
                transform: 'translateY(100vh)'
            },
            {
                transform: 'translateY(0vh)',
                offset: 0.3
            },
            ...inAnimation.keyframes          
        ],
        options: {
            duration: (inAnimation.frames / 60) * 500,
            fill: 'both',
            easing: 'linear'
        }
    };
    if (matchRoute(n, '/')) return {...slideDefaultAnimation, direction: 'right'};
    if (iOS() && !isPWA()) {
        return {
          type: 'none',
          duration: 0
        }
    }
    return {
        in: gestureNavigating ? slideDefaultAnimation : springAnimation,
        out: slideDefaultAnimation
    }
};
export default class ModalExample extends React.Component<ModalScreenProps> {
    private goingBack: boolean = false;
    
    onClose = () => {
        if (this.goingBack) return;
        this.props.navigation.goBack();
        this.goingBack = true;
    }
    render() {
        return (
            <div className="modal-presentation">
                <ClickAwayListener onClickAway={this.onClose}>
                    <div className="modal"></div>
                </ClickAwayListener>
            </div>
        );
    }
}