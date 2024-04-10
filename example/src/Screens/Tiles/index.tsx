import React from 'react';
import { Heroes, Hero } from '../../assets/Heroes';
import { Anchor, ScreenComponentProps } from '@react-motion-router/stack';
import Tile from '../../Components/Tile';
import './index.css';

interface TilesProps extends ScreenComponentProps { }

interface TilesState {
    heroes: Hero[];
}


export default class Tiles extends React.Component<TilesProps, TilesState> {
    static isFirstLoad = false;
    state: TilesState = {
        heroes: Heroes
    }

    componentDidMount() {
        this.props.navigation.transition?.finished.then(() => {
            if (!Tiles.isFirstLoad) {
                Tiles.isFirstLoad = true;
                this.forceUpdate();
            }
        });
    }

    render(): React.ReactNode {
        return (
            <div className={`tiles ${Tiles.isFirstLoad ? 'loaded' : 'suspense'}`}>
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