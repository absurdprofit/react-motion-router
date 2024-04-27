import React from 'react';
import { Hero } from '../../assets/Heroes';
import { SharedElement } from '@react-motion-router/core';
import * as Stack from '@react-motion-router/stack';
import { getInset } from '../../common/utils';
import './index.css';

interface TileProps {
    navigation: Stack.Navigation;
    hero: Hero;
    onClick?: () => void;
}

let heroID = '';
export default function Tile({ hero, navigation, onClick }: TileProps) {
    const [inset, setInset] = React.useState('');
    const imageRef = React.useRef<HTMLImageElement | null>(null);

    React.useEffect(() => {
        navigation.transition?.finished.then(() => {
            if (navigation.current.url?.pathname === '/tiles') {
                setInset('');
            }
        });
    }, []);

    return (
        <div onClick={() => {
            const image = imageRef.current;
            if (image) {
                const imageRect = image.getBoundingClientRect();
                setInset(
                    getInset(-imageRect.top, -imageRect.right, -imageRect.bottom, -imageRect.left)
                );
            }
            heroID = hero.id;
            if (onClick) {
                onClick();
            }
        }} className="tile">
            <SharedElement id={hero.id} config={{
                duration: 200
            }}>
                <img
                    ref={imageRef}
                    src={hero.photoUrl}
                    alt={hero.name}
                    width={hero.photoWidth}
                    height={hero.photoHeight}
                    decoding="async"
                    style={{
                        clipPath: (heroID === hero.id ? inset : '')
                    }}
                />
            </SharedElement>
        </div>
    );
}