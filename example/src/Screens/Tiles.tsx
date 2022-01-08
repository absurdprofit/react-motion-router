import React from 'react';
import { Heroes, Hero } from '../assets/Heroes';
import {Navigation, Anchor} from 'react-motion-router';
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
                <Navbar title="Tiles Demo" on_back={() => this.props.navigation.go_back()} />
                <div className="content">
                    {this.state.heroes.map((hero: Hero, index: number) => {
                        return (
                            <Anchor href={`/slides?hero=${index}`}>
                                <Tile hero={hero} key={index} onClick={() => {
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