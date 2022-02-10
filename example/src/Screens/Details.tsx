import React from 'react';
import {Navigation, SharedElement, Motion} from 'react-motion-router';
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
                <Motion.Consumer>
                    {(progress) => {
                        return (
                            <IconButton style={{
                                position: "absolute",
                                color: 'white',
                                transform: `translate(0px, ${-100 + progress}px)`,
                                opacity: progress / 100,
                                zIndex: 10000
                            }} onClick={() => {props.navigation.goBack()}}>
                                <ClearIcon />
                            </IconButton>
                        );
                    }}
                </Motion.Consumer>
                <div className="profile-info">
                    <SharedElement config={{
                        transformOrigin: 'bottom bottom',
                        x: {
                            easingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        },
                        y: {
                            easingFunction: 'ease-out'
                        }
                    }} id={props.route.params.profile.id}>
                        <img src={props.route.params.profile.photo} alt="profile-details" />
                    </SharedElement>
                    <div className="text-content">
                        <SharedElement id={`title-${props.route.params.profile.id}`} config={{
                            type: 'fade-through'
                        }}>
                            <h1>{props.route.params.profile.name}</h1>
                        </SharedElement>
                        <Motion.Consumer>
                            {(progress) => {
                                return (
                                    <p style={{
                                        opacity: progress / 100,
                                        transform: `translateY(${((100 - progress) / 100) * 30}px)`
                                    }}>{props.route.params.profile.description}</p>
                                );
                            }}
                        </Motion.Consumer>
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