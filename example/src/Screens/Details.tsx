import React from 'react';
import {Navigation, SharedElement} from 'react-motion-router';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import '../css/Details.css';

interface DetailsProps {
    navigation: Navigation;
    route: {
        params: {
            [key:string]:any;
        }
    };
}

export default function Details(props: DetailsProps) {
    if (props.route.params.profile) {
        return (
            <div className="details" style={{width: "100%", height: "100%"}}>
                <SharedElement id={`${props.route.params.profile.id}-card-bg`}>
                    <div className="card-bg"></div>
                </SharedElement>
                <IconButton style={{
                    position: "absolute",
                    color: 'grey',
                    zIndex: 10000
                }} onClick={() => {props.navigation.goBack()}}>
                    <SharedElement id="back" config={{
                        type: 'fade-through'
                    }}>
                        <ClearIcon />
                    </SharedElement>
                </IconButton>
                <div className="profile-info">
                    <SharedElement id={props.route.params.profile.id}>
                        <img src={props.route.params.profile.photo} alt="profile-details" />
                    </SharedElement>
                    <div className="text-content">
                        <SharedElement id={`title-${props.route.params.profile.id}`} config={{
                            type: 'fade-through'
                        }}>
                            <h1>{props.route.params.profile.name}</h1>
                        </SharedElement>
                        <div className="description">
                            <SharedElement id={`description-${props.route.params.profile.id}`}>
                                <p>{props.route.params.profile.description}</p>
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