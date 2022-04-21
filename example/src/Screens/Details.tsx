import React from 'react';
import {Navigation, SharedElement} from 'react-motion-router';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import '../css/Details.css';
import { Hero } from '../assets/Heroes';

interface DetailsProps {
    navigation: Navigation;
    route: {
        params: {
            hero: Hero;
            noBg?: boolean;
        }
    };
}

export default function Details(props: DetailsProps) {
    const {hero, noBg} = props.route.params;
    const photoAspect = (hero.photo.width / hero.photo.height);
    if (hero) {
        return (
            <div className="details" style={{width: "100%", height: "100%", backgroundColor: Boolean(noBg) ? 'white' : undefined}}>
                <div className="top"></div>
                {!Boolean(noBg)
                &&
                <SharedElement id={`${hero.id}-card-bg`}>
                    <div className="card-bg"></div>
                </SharedElement>}
                <IconButton style={{
                    position: "absolute",
                    color: 'grey',
                    zIndex: 10000
                }} onClick={() => {props.navigation.goBack()}}>
                    <SharedElement id="back" config={{
                        type: 'fade-through'
                    }}>
                        <ClearIcon style={{
                            zIndex: 100
                        }} />
                    </SharedElement>
                </IconButton>
                <div className="profile-info">
                    <SharedElement id={`${hero.id}-gradient-overlay`}>
                        <div className="gradient-overlay" style={{height: window.innerWidth / photoAspect, width: window.innerWidth}}></div>
                    </SharedElement>
                    <SharedElement id={hero.id}>
                        <img src={hero.photo.url} alt="profile-details" width={hero.photo.width} height={hero.photo.height} />
                    </SharedElement>
                    <div className="text-content">
                        <SharedElement id={`title-${hero.id}`}>
                            <Typography
                                style={{fontWeight: 'bold', fontSize: '28px', zIndex: 10}}
                                gutterBottom
                                variant="h4"
                                component="h4"
                            >
                                {hero.name}
                            </Typography>
                        </SharedElement>
                        <div className="description">
                            <SharedElement id={`description-${hero.id}`}>
                                <p style={{zIndex: 10}}>{hero.description}</p>
                            </SharedElement>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div className="details">
                <h1>Return Home</h1>
                <button onClick={() => {props.navigation.goBack()}}>Back</button>
            </div>
        );
    }
}