import React, {useEffect, useState} from 'react';
import { Hero, Heroes } from '../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Navigation } from '@react-motion-router/stack';
import { SharedElement, Motion } from '@react-motion-router/core';
import IconButton from '@mui/material/IconButton';
import '../css/Slides.css';
import { SwipeStartEvent, SwipeEvent, SwipeEndEvent } from 'web-gesture-events';
import { lerp } from '../common/utils';

interface SlidesProps {
    navigation: Navigation;
    route: {
        params: {
            hero: number;
        }
    }
}

let isLoaded = false;
export default function Slides(props: SlidesProps) {
    const [index, setIndex] = useState(props.route.params.hero);
    let y = 0;

    const goBack = () => {
        props.navigation.metaData.set('theme-color', '#fee2551');
        props.navigation.goBack();
    }

    const onSwipeStart = (e: SwipeStartEvent) => {
        y = e.y;
        window.addEventListener('swipe', onSwipe);
        
        window.addEventListener('swipeend', onSwipeEnd, {once: true});
    };

    const onSwipe = (e: SwipeEvent) => {
        if (e.direction === "down") {
            if (e.target instanceof HTMLImageElement) {
                e.target.style.transform = `translateY(${e.y - y}px)`;
            }
        }
    };

    const onSwipeEnd = (e: SwipeEndEvent) => {

        window.removeEventListener('swipe', onSwipe);
        if (e.target instanceof HTMLImageElement) {
            if (e.y - y > 100) {
                goBack();
                return;
            } 
            e.target.style.transform = `translateY(${0}px)`;
        }
    }

    useEffect(() => {
        props.navigation.metaData.set('theme-color', '#222222');

        window.addEventListener('page-animation-end', () => {
            isLoaded = true;
        }, {once: true});
        window.addEventListener('swipestart', onSwipeStart);
    

        return () => {
            window.removeEventListener('swipestart', onSwipeStart);
        }
    }, []);

    return (
        <div className={`slides ${isLoaded ? 'loaded' : 'suspense'}`}>
            <div className="back">
                <IconButton style={{color: 'white'}} onClick={goBack} disableRipple>
                    <SharedElement id="back" config={{
                        type: 'fade-through'
                    }}>
                        <ClearIcon />
                    </SharedElement>
                </IconButton>
            </div>
            <Motion.Consumer>
                {(progress) => {
                    progress = progress / 100;
                    return (
                        <div
                            className="title"
                            style={{
                                transform: `translate(-50%, ${lerp(-100, 0, progress)}px)`,
                                opacity: lerp(0, 1, progress)
                            }}
                        >
                            <h2>{Heroes[index].name}</h2>
                        </div>
                    );
                }}
            </Motion.Consumer>
            <div>
            {
                Heroes.map((hero: Hero, _index: number) => {
                    return (
                        <div className="slide" key={_index}>
                            {
                                <SharedElement id={`${_index !== index ? 'no-transition-' : ''}${hero.id}`}>
                                    <img
                                        src={hero.photo.url}
                                        alt={hero.name}
                                        style={{transition: '0.2s transform ease'}}
                                        {...{"data-gesturetarget": true}}
                                    />
                                </SharedElement>
                            }
                        </div>
                    );
                })
            }
            </div>
        </div>
    );
}