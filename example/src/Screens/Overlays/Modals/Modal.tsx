import React, { Suspense } from 'react';
import { Motion } from '@react-motion-router/core';
import { Stack } from '@react-motion-router/stack';
import { motion, AnimationProps } from 'framer-motion';
import { lerp } from '../../../common/utils';
import '../../../css/Modal.css';

const Player = React.lazy(() => import('./Player'));

interface ModalParams {
    sheetView: boolean;
    top?: number
}

interface ModalScreenProps extends Stack.ScreenComponentProps<ModalParams> {}

interface ModalScreenState {
    disabled: boolean;
    stiffness: number;
    opacity: number;
    y: number;
    transition: AnimationProps['transition'];
}

let isFirstLoad = true;
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
        this.props.navigation.metaData.set('theme-color', '#b19e3b');

        this.props.navigation.addEventListener('page-animation-end', () => {
            isFirstLoad = true;
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
        this.props.navigation.addEventListener('motion-progress-start', this.disable);
        this.props.navigation.addEventListener('motion-progress-end', this.enable);
        if (this.ref) {
            if (this.ref.parentElement?.parentElement) {
                this.ref.parentElement.parentElement.style.width = '100vw';
                this.ref.parentElement.parentElement.style.height = '100vh';
            }
        }
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('motion-progress-start', this.disable);
        this.props.navigation.removeEventListener('motion-progress-end', this.enable);
        this.props.navigation.metaData.set('theme-color', '#fee255a1');
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

        this.setState({disabled: true});
    }
    render() {
        const {sheetView, top} = this.props.route.params;
        
        return (
            <dialog
                open
                className={`modal-presentation ${isFirstLoad ? 'loaded' : 'suspense'}`}
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
                                </Suspense>
                            </motion.div>
                        );
                    }}
                </Motion.Consumer>
                
            </dialog>
        );
    }
}