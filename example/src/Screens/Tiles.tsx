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
                    <Navbar title="Tiles Demo" backButton />
                </SharedElement>
                <div className="content">
                    {this.state.heroes.map((hero: Hero, index: number) => {
                        return (
                            <Anchor key={index} href="/slides" params={{
                                hero: index
                            }}>
                                <Tile navigation={this.props.navigation} hero={hero} />
                            </Anchor>
                        );
                    })}
                </div>
            </div>
        );
    }
}