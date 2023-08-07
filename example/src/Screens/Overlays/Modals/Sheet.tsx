import React, {useState} from 'react';
import { Anchor, useMotion } from '@react-motion-router/core';
import { Button } from '@mui/material';
import { Stack } from '@react-motion-router/stack';
import { motion } from 'framer-motion';
import { lerp } from '../../../common/utils';
import ClickAwayListener from '@mui/base/ClickAwayListener';

interface SheetProps extends Stack.ScreenComponentProps {}

let isFirstLoad = true;
const transition = {
    type: 'spring',
    mass: 0.25,
    damping: 5
}
export default function Sheet({navigation, route}: SheetProps) {
    const progress = useMotion() / 100;
    const [disabled, setDisabled] = useState(false);
    const [stiffness] = useState(50);

    const onClose = () => {
        if (disabled) return;
        navigation.goBack();
        setDisabled(true);
    }

    const goHome = () => {
        navigation.parent?.goBack();
    }
    
    return (
        <ClickAwayListener onClickAway={onClose}>
            <motion.div
                className={`modal ${isFirstLoad ? 'loaded' : 'suspense'}`}
                initial={{
                    transform: `translateY(115vh)`
                }}
                style={{
                    // opacity: true ? this.state.opacity : 1,
                    
                }}
                animate={{
                    transform: `translateY(${lerp(false ? 92 : 100, 0, progress)}vh)`,
                    borderRadius: '15px 15px 0px 0px'
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
        </ClickAwayListener>
    );
}