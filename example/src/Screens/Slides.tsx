import React, {useEffect, useState} from 'react';
import { Hero, Heroes } from '../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Navigation, SharedElement, Motion } from 'react-motion-router';
import SwipeableViews from 'react-swipeable-views';
import { bindKeyboard } from 'react-swipeable-views-utils';
import IconButton from '@mui/material/IconButton';
import '../css/Slides.css';
import { SwipeStartEvent, SwipeEvent, SwipeEndEvent } from 'web-gesture-events';

const KeyboardSwipeableViews = bindKeyboard(SwipeableViews);

interface SlidesProps {
    navigation: Navigation;
    route: {
        params: {
            hero: number;
        }
    }
}
export default function Slides(props: SlidesProps) {
    const [index, setIndex] = useState(props.route.params.hero);
    let y = 0;

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
                props.navigation.goBack();
                return;
            } 
            e.target.style.transform = `translateY(${0}px)`;
        }
    }

    useEffect(() => {
        window.addEventListener('swipestart', onSwipeStart);
    

        return () => {
            window.removeEventListener('swipestart', onSwipeStart);
        }
    });

    return (
        <div className="slides">
            <div className="back">
                <IconButton style={{color: 'white'}} onClick={() => props.navigation.goBack()}>
                    <SharedElement id="back" config={{
                        type: 'fade-through'
                    }}>
                        <ClearIcon />
                    </SharedElement>
                </IconButton>
            </div>
            <Motion.Consumer>
                {(progress) => {
                    return (
                        <div className="title" style={{transform: `translate(-50%, ${-100 + progress}px)`, opacity: progress / 100}}>
                            <h2>{Heroes[index].name}</h2>
                        </div>
                    );
                }}
            </Motion.Consumer>
            <KeyboardSwipeableViews onChangeIndex={(index: number) => setIndex(index)} index={index}>
            {
                Heroes.map((hero: Hero, _index: number) => {
                    return (
                        <div className="slide" key={_index}>
                            {
                                <SharedElement id={`${_index !== index ? 'no-transition-' : ''}${hero.id}`}>
                                    <img
                                        src={hero.photo}
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
            </KeyboardSwipeableViews>
        </div>
    );
}