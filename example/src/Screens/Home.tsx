import React, { useEffect } from 'react';
import { SharedElement } from '@react-motion-router/core';
import { Stack } from '@react-motion-router/stack';
import ListItemComponent from '../Components/ListItem';
import Navbar from '../Components/Navbar';
import '../css/Home.css';

interface HomeProps extends Stack.ScreenComponentProps {}

interface ListItem {
    title: string;
    href: string;
    description: string;
}

let isLoaded = false;
export default function Home(props: HomeProps) {
    const list = [
        {
            title: 'Tiles Demo',
            description: "Image tiles that zoom-in and then allow gestures to paginate and dismiss",
            href: '/tiles'
        },
        {
            title: 'Cards Demo',
            description: 'Card reveal with shared element transitions',
            href: '/cards'
        },
        {
            title: 'Cards Demo 2',
            description: 'Heavier card demo with fading gradient overlay and cross-fading texts',
            href: '/cards-2'
        },
        {
            title: 'Overlay Demo',
            description: 'Various Overlays such as modals with spring and default timing functions',
            href: '/overlays'
        }
    ];

    useEffect(() => {
        props.orientation.lock?.('portrait');
        window.addEventListener('page-animation-end', () => {
            isLoaded = true;
        }, {once: true});
    }, []);

    return (
        <div className={`home ${isLoaded ? 'loaded' : 'suspense'}`}>
            <SharedElement id="navbar" config={{
                type: 'fade'
            }}>
                <Navbar title="React Motion Router" />
            </SharedElement>
            <ul className={`list`} role="group" aria-label="Available Demos">
                {
                    list.map((item: ListItem, index: number) => {
                        return <ListItemComponent
                                    key={index}
                                    href={item.href}
                                    title={item.title}
                                    description={item.description}
                                />
                    })
                }
            </ul>
            {/* <Anchor href="/video-test">
                Video Text
            </Anchor> */}
        </div>
    )
}