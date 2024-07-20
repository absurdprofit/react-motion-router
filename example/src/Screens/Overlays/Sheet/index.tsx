import React, { useState } from 'react';
import { Button } from '@mui/material';
import { ScreenComponentProps, Anchor, Navigation } from '@react-motion-router/stack';
import { lerp } from '../../../common/utils';
import './index.css';
import { useMotion } from '@react-motion-router/core';

interface SheetProps extends ScreenComponentProps { }

let isFirstLoad = true;
export default function Sheet({ navigation, route }: SheetProps) {
    const progress = useMotion();
    const [stiffness] = useState(50);

    return (
        <div
            className={`sheet modal ${isFirstLoad ? 'loaded' : 'suspense'}`}
            style={{ borderRadius: '15px 15px 0px 0px' }}
        >
            <div className="notch" style={{ opacity: lerp(0, 1, progress) }}></div>
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
                <Anchor goBack navigation={navigation.parent! as Navigation}>
                    <Button variant="contained" className="close" fullWidth>
                        Go Home
                    </Button>
                </Anchor>
            </div>
        </div>
    );
}