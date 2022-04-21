import React from 'react';
import {Anchor, Navigation, SharedElement} from 'react-motion-router';
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
        }
    ]

    return (
        <div className="home">
            <SharedElement id="navbar" config={{
                type: 'fade'
            }}>
                <Navbar title="React Motion Router" />
            </SharedElement>
            <Anchor href='/slides'>This is a link</Anchor>
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
        </div>
    )
}