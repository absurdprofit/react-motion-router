import React from 'react';
import { Anchor } from 'react-motion-router';
import { Button } from '@mui/material';


interface DefaultProps {
    onClose: React.MouseEventHandler;
}

export default function Default(props: DefaultProps) {
    return (
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
            <Button variant="contained" className="close" onClick={props.onClose}>Close</Button>
        </div>
    );
}