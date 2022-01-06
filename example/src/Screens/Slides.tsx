import React, {useState} from 'react';
import { Hero, Heroes } from '../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Navigation, SharedElement } from 'react-motion-router';
import SwipeableViews from 'react-swipeable-views';
import IconButton from '@mui/material/IconButton';
import '../css/Slides.css';

interface SlidesProps {
    navigation: Navigation;
    route: {
        params: {
            hero: number;
        }
    }
}
export default function Slides(props: SlidesProps) {
    const [index, set_index] = useState(props.route.params.hero);
    return (
        <div className="slides">
            <div className="back">
                <IconButton style={{color: 'white'}} onClick={() => props.navigation.go_back()}>
                    <ClearIcon />
                </IconButton>
            </div>
            <div className="title">
                <h2>{Heroes[index].name}</h2>
            </div>
            <SwipeableViews onChangeIndex={(index: number) => set_index(index)} index={index}>
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
            </SwipeableViews>
        </div>
    );
}