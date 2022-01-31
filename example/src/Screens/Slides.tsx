import React, {useState} from 'react';
import { Hero, Heroes } from '../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Navigation, SharedElement } from 'react-motion-router';
import SwipeableViews from 'react-swipeable-views';
import { bindKeyboard } from 'react-swipeable-views-utils';
import IconButton from '@mui/material/IconButton';
import '../css/Slides.css';

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
    return (
        <div className="slides">
            <div className="back">
                <IconButton style={{color: 'white'}} onClick={() => props.navigation.goBack()}>
                    <ClearIcon />
                </IconButton>
            </div>
            <div className="title">
                <h2>{Heroes[index].name}</h2>
            </div>
            <KeyboardSwipeableViews onChangeIndex={(index: number) => setIndex(index)} index={index}>
            {
                Heroes.map((hero: Hero, _index: number) => {
                    return (
                        <div className="slide" key={_index}>
                            {
                                <SharedElement id={`${_index !== index ? 'no-transition-' : ''}${hero.id}`}>
                                    <img src={hero.photo} alt={hero.name} />
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