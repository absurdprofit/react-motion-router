import React from 'react';
import { Heroes, Hero } from '../assets/Heroes';
import {Anchor, SharedElement} from '@react-motion-router/core';
import { Navigation } from '@react-motion-router/stack';
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
    static isLoaded = false;
    state: TilesState = {
        heroes: Heroes
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', () => {
            if (!Tiles.isLoaded) {
                Tiles.isLoaded = true;
                this.forceUpdate();
            }
        }, {once: true});
    }

    render(): React.ReactNode {
        return(
            <div className={`tiles ${Tiles.isLoaded ? 'loaded' : 'suspense'}`}>
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