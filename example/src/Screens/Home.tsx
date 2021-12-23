import React from 'react';
import {Navigation} from 'react-motion-router';
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
            title: 'Card Demo',
            description: 'Card reveal with shared element transitions',
            onClick: () => props.navigation.navigate('/cards')
        }
    ]
    return (
        <div className="home">
            <Navbar title="Shared Element Demo" />
            <div className="list">
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