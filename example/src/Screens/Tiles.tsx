import React from 'react';
import { Heroes, Hero } from '../assets/Heroes';
import {Navigation, Anchor, SharedElement} from 'react-motion-router';
import Navbar from '../Components/Navbar';
import Tile from '../Components/Tile';
import '../css/Tiles.css';

interface TilesProps {
    navigation: Navigation;
}

interface TilesState {
    heroes: Hero[];
}
export default class Tiles extends React.Component<TilesProps, TilesState> {
    state: TilesState = {
        heroes: Heroes
    }
    
    render(): React.ReactNode {
        return(
            <div className="tiles">
                <SharedElement id="navbar">
                    <Navbar title="Tiles Demo" onBack={() => this.props.navigation.goBack()} />
                </SharedElement>
                <div className="content">
                    {this.state.heroes.map((hero: Hero, index: number) => {
                        return (
                            <Anchor key={index} href={`/slides?hero=${index}`}>
                                <Tile hero={hero} onClick={() => {
                                    this.props.navigation.navigate('/slides', {
                                        hero: index
                                    })
                                }} />
                            </Anchor>
                        );
                    })}
                </div>
            </div>
        );
    }
}