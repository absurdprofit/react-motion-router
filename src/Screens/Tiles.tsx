import React from 'react';
import { Heroes, Hero } from '../assets/Heroes';
import {Navigation} from '../Navigation';
import Tile from '../Components/Tile';

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
                <div className="nav-bar">
                    <div className="back-button">
                        <button onClick={() => this.props.navigation.go_back()}>&lt;</button>
                    </div>
                    <div className="page-title">
                        <h3>Tiles Demo</h3>
                    </div>
                </div>
                <div className="content">
                    {this.state.heroes.map((hero: Hero, index: number) => {
                        return <Tile hero={hero} key={index} onClick={() => {
                            this.props.navigation.navigate('/details', {
                                profile: hero
                            })
                        }} />
                    })}
                </div>
            </div>
        );
    }
}