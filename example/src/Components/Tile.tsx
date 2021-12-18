import React from 'react';
import {Hero} from '../assets/Heroes';
import {SharedElement} from '../../../src';

interface TileProps {
    hero: Hero;
    onClick?: () => void;
}
export default class Tile extends React.Component<TileProps> {
    render() {
        return (
            <div onClick={this.props.onClick} className="tile">
                <SharedElement id={this.props.hero.id}>
                    <img src={this.props.hero.photo} alt={this.props.hero.name} />
                </SharedElement>
            </div>
        );
    }
}