import React, { useEffect, useState } from 'react';
import { Hero, Heroes } from '../../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Anchor, ScreenComponentProps } from '@react-motion-router/stack';
import { SharedElement } from '@react-motion-router/core';
import IconButton from '@mui/material/IconButton';
import './index.css';
import { SwipeStartEvent, SwipeEvent, SwipeEndEvent } from 'web-gesture-events';
import { bindKeyboard } from 'react-swipeable-views-utils';
import SwipeableViews from 'react-swipeable-views';

interface SlidesProps extends ScreenComponentProps<{ hero: number; }> { }

const KeyboardSwipeableViews = bindKeyboard(SwipeableViews);

let isFirstLoad = false;
export default function Slides(props: SlidesProps) {
    const [index, setIndex] = useState(props.route.params.hero);
    let y = 0;

    const onSwipeStart = (e: SwipeStartEvent) => {
        y = e.y;
        window.addEventListener('swipe', onSwipe);

        window.addEventListener('swipeend', onSwipeEnd, { once: true });
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
        props.navigation.metaData.set('theme-color', '#222222');

        props.navigation.addEventListener('go-back', () => {
            props.navigation.metaData.set('theme-color', '#fee2551');
        }, { once: true, capture: true });

        props.navigation.transition?.finished.then(() => {
            isFirstLoad = true;
        });
        window.addEventListener('swipestart', onSwipeStart);


        return () => {
            window.removeEventListener('swipestart', onSwipeStart);
        }
    }, []);

    return (
        <div className={`slides ${isFirstLoad ? 'loaded' : 'suspense'}`}>
            <div className="back">
                <Anchor goBack>
                    <IconButton disableRipple>
                        <SharedElement id="back" config={{
                            type: 'fade-through'
                        }}>
                            <ClearIcon style={{ color: 'white' }} />
                        </SharedElement>
                    </IconButton>
                </Anchor>
            </div>
            <div className="title">
                <SharedElement id="tiles-demo-title" config={{ type: 'fade-through', transformOrigin: 'center center' }}>
                    <h2>{Heroes[index].name}</h2>
                </SharedElement>
            </div>
            <KeyboardSwipeableViews onChangeIndex={(index: number) => setIndex(index)} index={index}>
                {
                    Heroes.map((hero: Hero, _index: number) => {
                        return (
                            <div className="slide" key={_index}>
                                {
                                    <SharedElement id={hero.id} disabled={_index !== index} config={{ styles: ["object-fit", "aspect-ratio"] }}>
                                        <img
                                            src={hero.photoUrl}
                                            alt={hero.name}
                                            style={{ transition: '0.2s transform ease' }}
                                            {...{ "data-gesturetarget": true }}
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