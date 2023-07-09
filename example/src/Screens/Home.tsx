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

let isFirstLoad = false;
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
        },
        {
            title: 'Video Demo',
            description: 'Video with shared element transitions',
            href: '/video'
        }
    ];

    useEffect(() => {
        props.navigation.finished.then(() => {
            isFirstLoad = true;
        });
        if (!props.orientation) return;
        props.orientation.onchange = async () => {
            if (props.orientation.type !== "portrait-primary") {
                try {
                    await props.orientation.lock?.('portrait');
                } catch (e) {}
            }
        }
    }, []);

    return (
        <div className={`home ${isFirstLoad ? 'loaded' : 'suspense'}`}>
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
        </div>
    )
}