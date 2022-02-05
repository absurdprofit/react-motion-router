import React from 'react';
import {Navigation, SharedElement, Motion} from 'react-motion-router';
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
        <Motion.Consumer>
            {(progress) => {
                return (
                    <div className="home">
                        <SharedElement id="navbar">
                            <Navbar title="Shared Element Demo" />
                        </SharedElement>
                        <div className={`list ${progress}`}>
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

                        <div className="motion-element" style={{transform: `translate(-50%, -${progress}px) rotate(${-progress}deg)`}}>MOTION</div>
                    </div>
                );
            }}
        </Motion.Consumer>
    )
}