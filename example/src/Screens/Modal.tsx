import React from 'react';
import { AnimationConfig, Navigation } from 'react-motion-router';
import '../css/Modal.css';
import { ClickAwayListener } from '@mui/material';

interface ModalScreenProps {
    navigation: Navigation;
}

export const ModalAnimation: AnimationConfig = {
    type: 'slide',
    direction: 'up',
    duration: 350
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