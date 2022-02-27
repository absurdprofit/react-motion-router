import React from 'react';
import {Hero} from '../assets/Heroes';
import {Navigation, SharedElement} from 'react-motion-router';

interface TileProps {
    hero: Hero;
    onClick?: () => void;
    navigation: Navigation;
}

let inset = '';
let heroID = '';
export default class Tile extends React.Component<TileProps> {
    private ref: HTMLImageElement | null = null;

    pageAnimationEnd() {
        if (this.props.navigation.location.pathname === '/tiles') {
            inset = '';
            this.forceUpdate();
        }
    }

    componentDidMount() {
        window.addEventListener('page-animation-end', this.pageAnimationEnd.bind(this), {once: true});
    }

    render() {
        return (
            <div onClick={() => {
                if (this.ref) {
                    const imageRect = this.ref.getBoundingClientRect();
                    inset = `inset(${-imageRect.top+64}px ${-imageRect.right}px ${-imageRect.bottom}px ${-imageRect.left}px)`;
                }
                heroID = this.props.hero.id;
                if (this.props.onClick) {
                    this.props.onClick();
                }
            }} className="tile">
                <SharedElement id={this.props.hero.id} config={{
                    duration: 200
                }}>
                    <img
                        ref={c => this.ref = c}
                        src={this.props.hero.photo}
                        alt={this.props.hero.name}
                        style={{
                            clipPath: (heroID === this.props.hero.id ? inset : '')
                        }}
                    />
                </SharedElement>
            </div>
        );
    }
}