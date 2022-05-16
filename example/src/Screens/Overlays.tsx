import { Button } from '@mui/material';
import React, { useEffect } from 'react';
import { Anchor, AnimationConfigFactory, Motion, Navigation } from 'react-motion-router';
import { matchRoute } from 'react-motion-router/common/utils';
import ModalExample from './Modal';

interface OverlaysProps {
    navigation: Navigation;
}

export const OverlaysAnimation: AnimationConfigFactory = (currentPath: string, nextPath: string) => {
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

export default function Overlays(props: OverlaysProps) {
    const openModal = () => {
        props.navigation.navigate('/modal');
    }
    const shouldAnimate = props.navigation.history.previous === '/overlays' || props.navigation.history.next === '/modal';
    useEffect(() => {
        document.body.style.backgroundColor = 'rgba(254, 226, 85)';

        return () => {
            document.body.style.backgroundColor = 'unset';
        }
    })
    return (
        <Motion.Consumer>
            {(progress) => {
                return (
                    <div className="overlays" style={
                        {
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'white',
                            borderRadius: shouldAnimate ? `${15 * (progress/100)}px` : '0px'
                        }
                    }>
                        <Button onClick={openModal}>Open Modal</Button>
                        <Anchor href="/" goBack>Go Back</Anchor>
                    </div>
                );
            }}
        </Motion.Consumer>
    );
}

export {ModalExample};