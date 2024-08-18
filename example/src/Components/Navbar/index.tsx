import React, { memo } from 'react';
import { SharedElement } from '@react-motion-router/core';
import './index.css';
import BackButton from '../BackButton';
import { useNavigation, useRoute } from '@react-motion-router/stack';

interface NavbarProps {
    title: string;
}
function Navbar(props: NavbarProps) {
    const navigation = useNavigation();
    const route = useRoute<{ count: number }>();
    const { count = 0 } = route.params;
    const setCount = (count: number) => {
        route.setParams({ count });
    }
    const clearCount = () => {
        route.setParams({ count: 0 });
    }

    return (
        <SharedElement id="navbar" config={{
            type: 'fade'
        }}>
            <div className="navbar">
                <div className="back">
                    {
                        navigation.canGoBack ?
                            <BackButton />
                            :
                            undefined
                    }
                </div>
                <div className="title">
                    <SharedElement id={props.title.toLowerCase().split(' ').join('-') + "-title"} config={{ transformOrigin: 'center center' }}>
                        <h2>{props.title} - {count}</h2>
                    </SharedElement>
                    <button onClick={() => setCount(count + 1)}>Inc</button>
                    <button onClick={() => clearCount()}>Clear</button>
                </div>
            </div>
        </SharedElement>
    );
}

export default memo(Navbar);