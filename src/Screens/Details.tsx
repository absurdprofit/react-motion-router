import React from 'react';
import {Navigation} from '../Navigation';
import {SharedElement} from '../Navigation';

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
            <div className="details" style={{width: "100vw", height: "100vh"}}>
                <button style={{position: "absolute"}} onClick={() => {props.navigation.go_back()}}>Back</button>
                <div className="profile-info">
                    <SharedElement id={props.route.params.profile.id}>
                        <img src={props.route.params.profile.photo} alt="profile-details" />
                    </SharedElement>
                    <h1>{props.route.params.profile.name}</h1>
                    <p>{props.route.params.profile.description}</p>
                </div>
            </div>
        )
    } else {
        return (
            <div className="details">
                <h1>Return Home</h1>
                <button onClick={() => {props.navigation.go_back()}}>Back</button>
            </div>
        );
    }
}