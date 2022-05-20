import React from 'react';
import { Motion, Navigation } from 'react-motion-router';
import '../css/Modal.css';
import { AnimationConfigFactory, AnimationConfig } from 'react-motion-router/common/types';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from '../common/utils';
import { motion } from 'framer-motion';

interface ModalScreenProps {
    navigation: Navigation;
}

export const ModalAnimation: AnimationConfigFactory = (c, n, gestureNavigating) => {
    const slideDefaultAnimation: AnimationConfig = {
        type: 'slide',
        direction: 'right',
        duration: 500
    };
    const fadeIn = {
        keyframes: [
            {backgroundColor: 'rgba(0, 0, 0, 0)'},
            {backgroundColor: 'rgba(0, 0, 0, 0.3)'}
        ],
        options: {
            duration: 400,
        }
    };
    const fadeOut = {
        keyframes: [
            {backgroundColor: 'rgba(0, 0, 0, 0.3)'},
            {backgroundColor: 'rgba(0, 0, 0, 0)'}
        ],
        options: {
            duration: 300,
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

interface ModalScreenState {
    disabled: boolean;
}

export default class ModalExample extends React.Component<ModalScreenProps, ModalScreenState> {
    state: ModalScreenState = {
        disabled: false
    };

    disable = () => this.setState({disabled: true});
    enable = () => this.setState({disabled: false});

    componentDidMount() {
        window.addEventListener('motion-progress-start', this.disable);
        window.addEventListener('motion-progress-end', this.enable);
    }

    componentWillUnmount() {
        window.removeEventListener('motion-progress-start', this.disable);
        window.removeEventListener('motion-progress-end', this.enable);
    }

    onClose = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (this.state.disabled) return;
        for (let target of ev.nativeEvent.composedPath().reverse()) {
            if ('classList' in target)
                if ((target as HTMLElement).classList.contains('modal')) return;
        }
        this.props.navigation.goBack();
        this.setState({disabled: true});
    }
    render() {
        return (
            <div className="modal-presentation" onClick={this.onClose}>
                <Motion.Consumer>
                    {(progress) => {
                        return (
                            <motion.div
                                className="modal"
                                style={{
                                    transform: `translateY(${0.95 * (100-progress)}vh)`
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 1,
                                    mass: 10,
                                    damping: 3.7
                                }}
                            ></motion.div>
                        );
                    }}
                </Motion.Consumer>
            </div>
        );
    }
}