import React from 'react';
import {Navigation, SharedElement} from 'react-motion-router';
import Typography from '@mui/material/Typography';
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
    const [height, setHeight] = React.useState(0);
    if (props.route.params.profile) {
        return (
            <div className="details" style={{width: "100%", height: "100%", backgroundColor: Boolean(props.route.params.noBg) ? 'white' : undefined}}>
                <div className="top"></div>
                {!Boolean(props.route.params.noBg)
                &&
                <SharedElement id={`${props.route.params.profile.id}-card-bg`}>
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
                    <SharedElement id={`${props.route.params.profile.id}-gradient-overlay`}>
                        <div className="gradient-overlay" style={{height: height}}></div>
                    </SharedElement>
                    <SharedElement id={props.route.params.profile.id}>
                        <img src={props.route.params.profile.photo} alt="profile-details" ref={(ref) => {
                            if (ref && !height) {
                                setHeight(ref.getBoundingClientRect().height);
                            }
                        }} />
                    </SharedElement>
                    <div className="text-content">
                        <SharedElement id={`title-${props.route.params.profile.id}`}>
                            <Typography
                                style={{fontWeight: 'bold', fontSize: '28px', zIndex: 10}}
                                gutterBottom
                                variant="h4"
                                component="h4"
                            >
                                {props.route.params.profile.name}
                            </Typography>
                        </SharedElement>
                        <div className="description">
                            <SharedElement id={`description-${props.route.params.profile.id}`}>
                                <p style={{zIndex: 10}}>{props.route.params.profile.description}</p>
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