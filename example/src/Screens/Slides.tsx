import React, {useState} from 'react';
import { Heroes, Hero } from '../assets/Heroes';
import ClearIcon from '@mui/icons-material/Clear';
import { Navigation, SharedElement } from 'react-motion-router';
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
            <div className="slide">
                <SharedElement id={Heroes[index].id}>
                    <img src={Heroes[index].photo} alt={Heroes[index].name} />
                </SharedElement>
            </div>
        </div>
    );
}