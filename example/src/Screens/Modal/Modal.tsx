import React, { Suspense } from 'react';
import { Motion } from '@react-motion-router/core';
import { Navigation } from '@react-motion-router/stack';
import Default from './Default';
import '../../css/Modal.css';
import { motion, AnimationProps } from 'framer-motion';
import { lerp } from '../../common/utils';

const Player = React.lazy(() => import('./Player'));

interface ModalScreenProps {
    navigation: Navigation;
    route: {
        params: {
            sheetView: boolean;
            top?: number
        }
    }
}

interface ModalScreenState {
    disabled: boolean;
    stiffness: number;
    opacity: number;
    y: number;
    transition: AnimationProps['transition'];
}

let isLoaded = true;
export default class ModalExample extends React.Component<ModalScreenProps, ModalScreenState> {
    private ref: HTMLDialogElement | null = null;
    state: ModalScreenState = {
        disabled: false,
        stiffness: 50,
        opacity: 0,
        y: 15,
        transition: {
            type: 'tween',
            duration: 0,
            ease: 'linear'
        }
    };

    disable = () => this.setState({disabled: true});
    enable = () => this.setState({disabled: false});

    componentDidMount() {
        window.addEventListener('page-animation-end', () => {
            isLoaded = true;
            this.setState({stiffness: 200});
        }, {once: true});
        const {sheetView, top} = this.props.route.params;
        this.setState({
            opacity: 1,
            y: sheetView ? top || 90 : 115
        });

        if (!this.props.route.params.sheetView) {
            this.setState({
                transition: {
                    type: 'spring',
                    stiffness: this.state.stiffness,
                    mass: 0.25,
                    damping: 5
                }
            });
        }
        window.addEventListener('motion-progress-start', this.disable);
        window.addEventListener('motion-progress-end', this.enable);
        if (this.ref) {
            if (this.ref.parentElement?.parentElement) {
                this.ref.parentElement.parentElement.style.width = '100vw';
                this.ref.parentElement.parentElement.style.height = '100vh';
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('motion-progress-start', this.disable);
        window.removeEventListener('motion-progress-end', this.enable);
    }

    onClose = async (ev: React.MouseEvent<HTMLDialogElement | HTMLButtonElement, MouseEvent>) => {
        ev.stopPropagation();

        if (this.state.disabled) return;
        for (let target of ev.nativeEvent.composedPath()) {
            const {classList} = target as HTMLElement;
            if ('classList' in target)
                if (classList.contains('modal')) return;
                else if (classList.contains('close')) break;
                else continue;
        }

        await this.props.navigation.goBack();

        console.log("End");
        this.props.navigation.metaData.set('theme-color', '#fee255a1');

        this.setState({disabled: true});
    }
    render() {
        const {sheetView, top} = this.props.route.params;
        
        return (
            <dialog
                open
                className={`modal-presentation ${isLoaded ? 'loaded' : 'suspense'}`}
                ref={c => this.ref = c}            
                onClick={this.onClose}
            >
                <Motion.Consumer>
                    {(progress) => {
                        progress = progress / 100; // in the range 0 - 1
                        return (
                            <motion.div
                                className="modal"
                                initial={{
                                    transform: `translateY(${this.state.y}vh)`
                                }}
                                style={{
                                    opacity: sheetView ? this.state.opacity : 1,
                                    
                                }}
                                animate={{
                                    transform: `translateY(${lerp(sheetView ? top || 92 : 115, 15, progress)}vh)`,
                                    borderRadius: sheetView ? `${lerp(0, 15, progress)}px` : '15px'
                                }}
                                transition={{
                                    ...this.state.transition,
                                    ...{stiffness: this.state.stiffness}
                                }}
                            >
                                <div className="notch" style={{opacity: lerp(0, 1, progress)}}></div>
                                <Suspense fallback={<div className='content'></div>}>
                                    {!sheetView ?
                                    <Default onClose={this.onClose} />
                                    : <Player progress={progress} />}
                                </Suspense>
                            </motion.div>
                        );
                    }}
                </Motion.Consumer>
                
            </dialog>
        );
    }
}