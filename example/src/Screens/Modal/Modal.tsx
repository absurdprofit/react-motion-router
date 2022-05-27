import React from 'react';
import { Anchor, Motion, Navigation } from 'react-motion-router';
import '../../css/Modal.css';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { lerp } from '../../common/utils';

interface ModalScreenProps {
    navigation: Navigation;
}

interface ModalScreenState {
    disabled: boolean;
    stiffness: number;
}

let isLoaded = true;
export default class ModalExample extends React.Component<ModalScreenProps, ModalScreenState> {
    private ref: HTMLDialogElement | null = null;
    state: ModalScreenState = {
        disabled: false,
        stiffness: 50
    };

    disable = () => this.setState({disabled: true});
    enable = () => this.setState({disabled: false});

    componentDidMount() {
        window.addEventListener('page-animation-end', () => {
            isLoaded = true;
            this.setState({stiffness: 200});
        }, {once: true});
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

    onClose = (ev: React.MouseEvent<HTMLDialogElement | HTMLButtonElement, MouseEvent>) => {
        ev.stopPropagation();
        if (this.state.disabled) return;
        for (let target of ev.nativeEvent.composedPath()) {
            const {classList} = target as HTMLElement;
            if ('classList' in target)
                if (classList.contains('modal')) return;
                else if (classList.contains('close')) break;
                else continue;
        }
        this.props.navigation.goBack();
        this.setState({disabled: true});
    }
    render() {
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
                                    transform: 'translateY(115vh)'
                                }}
                                animate={{
                                    transform: `translateY(${lerp(115, 15, progress)}vh)`
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: this.state.stiffness,
                                    mass: 0.25,
                                    damping: 5
                                }}
                            >
                                <div className='content'>
                                    <h2 className='title'>Modal Example</h2>
                                    <p className='body'>
                                        This example uses <Anchor href="https://www.framer.com/motion/" target="_blank" rel="noopener">Framer Motion</Anchor> for 
                                        spring animations driven by the <b>Motion</b> component provided by <Anchor href="https://github.com/nxtexe/react-motion-router" target="_blank" rel="noopener"> React Motion Router</Anchor>.
                                        This example is built on top of the now standard <Anchor href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog" target="_blank" rel="noopener">&lt;dialog&gt; element</Anchor>.
                                    </p>
                                    <p>
                                        You can swipe from the top to dismiss or press the button below.
                                    </p>
                                    <Button variant="contained" className="close" onClick={this.onClose}>Close</Button>
                                </div>
                            </motion.div>
                        );
                    }}
                </Motion.Consumer>
            </dialog>
        );
    }
}