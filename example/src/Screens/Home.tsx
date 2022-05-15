import React, { useEffect } from 'react';
import {Navigation, SharedElement} from 'react-motion-router';
import ListItemComponent from '../Components/ListItem';
import Navbar from '../Components/Navbar';
import '../css/Home.css';

interface HomeProps {
    navigation: Navigation;
}

interface ListItem {
    title: string;
    description: string;
    onClick: () => void;
}

let isLoaded = false;
export default function Home(props: HomeProps) {
    const list = [
        {
            title: 'Tiles Demo',
            description: "Image tiles that zoom-in and then allow gestures to paginate and dismiss",
            onClick: () => props.navigation.navigate('/tiles')
        },
        {
            title: 'Cards Demo',
            description: 'Card reveal with shared element transitions',
            onClick: () => props.navigation.navigate('/cards')
        },
        {
            title: 'Cards Demo 2',
            description: 'Heavier card demo with fading gradient overlay and cross-fading texts',
            onClick: () => props.navigation.navigate('/cards-2')
        },
        {
            title: 'Overlay Demo',
            description: 'Various Overlays such as modals',
            onClick: () => props.navigation.navigate('/overlays')
        }
    ];

    useEffect(() => {
        window.addEventListener('page-animation-end', () => {
            isLoaded = true;
        }, {once: true});
    });

    return (
        <div className={`home ${isLoaded ? 'loaded' : 'suspense'}`}>
            <SharedElement id="navbar" config={{
                type: 'fade'
            }}>
                <Navbar title="React Motion Router" />
            </SharedElement>
            <div className={`list`}>
                {
                    list.map((item: ListItem, index: number) => {
                        return <ListItemComponent
                                    key={index}
                                    title={item.title}
                                    description={item.description}
                                    onClick={item.onClick}
                                />
                    })
                }
            </div>
            {/* <Anchor href="/video-test">
                Video Text
            </Anchor> */}
        </div>
    )
}