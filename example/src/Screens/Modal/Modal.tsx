import React from 'react';
import { Motion, Navigation } from 'react-motion-router';
import '../../css/Modal.css';
import { motion } from 'framer-motion';

interface ModalScreenProps {
    navigation: Navigation;
}

interface ModalScreenState {
    disabled: boolean;
}

let isLoaded = true;
export default class ModalExample extends React.Component<ModalScreenProps, ModalScreenState> {
    private ref: HTMLDivElement | null = null;
    state: ModalScreenState = {
        disabled: false
    };

    disable = () => this.setState({disabled: true});
    enable = () => this.setState({disabled: false});

    componentDidMount() {
        window.addEventListener('page-animation-end', () => isLoaded = true, {once: true});
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
            <div className={`modal-presentation ${isLoaded ? 'loaded' : 'suspense'}`} onClick={this.onClose} ref={c => this.ref = c}>
                <Motion.Consumer>
                    {(progress) => {
                        return (
                            <motion.div
                                className="modal"
                                style={{
                                    transform: isLoaded ? `translateY(${0.95 * (100-progress)}vh)` : 'translateY(0vh)'
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