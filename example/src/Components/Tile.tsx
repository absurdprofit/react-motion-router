import React, {useRef, useEffect} from 'react';
import {Hero} from '../assets/Heroes';
import {SharedElement} from 'react-motion-router';

interface TileProps {
    hero: Hero;
    onClick?: () => void;
}
export default function Tile(props: TileProps) {
    const ref = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (ref.current) {
            // ref.current.src = ref.current.dataset.src || '';
        }
    }, []);
    return (
        <div onClick={props.onClick} className="tile">
            <SharedElement id={props.hero.id} config={{
                duration: 200
            }}>
                <img
                    ref={ref}
                    // src={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAGklEQVR42mN8/5+BJMA4qmFUw6iGUQ201QAAzKYuaaLRYAgAAAAASUVORK5CYII="}
                    src={props.hero.photo}
                    alt={props.hero.name}
                />
            </SharedElement>
        </div>
    );
}