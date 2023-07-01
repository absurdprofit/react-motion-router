import React, {useState} from 'react';
import { Anchor, Motion } from '@react-motion-router/core';
import { Button } from '@mui/material';
import { Stack } from '@react-motion-router/stack';
import { motion } from 'framer-motion';
import { lerp } from '../../../common/utils';

interface SheetProps extends Stack.ScreenComponentProps {}

let isFirstLoad = true;
const transition = {
    type: 'spring',
    mass: 0.25,
    damping: 5
}
export default function Sheet({navigation, route}: SheetProps) {
    const [disabled, setDisabled] = useState(false);
    const [stiffness] = useState(50);

    const onClose = async (ev: React.MouseEvent<HTMLDialogElement | HTMLButtonElement, MouseEvent>) => {
        ev.stopPropagation();

        if (disabled) return;
        for (let target of ev.nativeEvent.composedPath()) {
            const {classList} = target as HTMLElement;
            if ('classList' in target)
                if (classList.contains('modal')) return;
                else if (classList.contains('close')) break;
                else continue;
        }

        await navigation.goBack();

        setDisabled(true);
    }

    const goHome = () => {
        navigation.parent?.goBack();
    }
    return (
        <dialog
            open
            className={`modal-presentation ${isFirstLoad ? 'loaded' : 'suspense'}`}
            onClick={onClose}
        >
            <Motion.Consumer>
                {(progress) => {
                    progress = progress / 100; // in the range 0 - 1
                    return (
                        <motion.div
                            className="modal"
                            initial={{
                                transform: `translateY(115vh)`
                            }}
                            style={{
                                // opacity: true ? this.state.opacity : 1,
                                
                            }}
                            animate={{
                                transform: `translateY(${lerp(false ? 92 : 115, 15, progress)}vh)`,
                                borderRadius: false ? `${lerp(0, 15, progress)}px` : '15px'
                            }}
                            transition={{
                                ...transition,
                                ...{stiffness: stiffness}
                            }}
                        >
                            <div className="notch" style={{opacity: lerp(0, 1, progress)}}></div>
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
                                <Button onClick={goHome} variant="contained" className="close">
                                    Go Home
                                </Button>
                            </div>
                        </motion.div>
                    );
                }}
            </Motion.Consumer>
            
        </dialog>
    );
}