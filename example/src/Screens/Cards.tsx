import React from 'react';
import { Navigation, SharedElement } from 'react-motion-router';
import Navbar from '../Components/Navbar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Hero, Heroes } from '../assets/Heroes';
import ButtonBase from '@mui/material/ButtonBase';
import '../css/Cards.css';

interface CardsProps {
    navigation: Navigation;
}
export default function Cards(props: CardsProps) {
    return (
        <div className="cards">
            <SharedElement id="navbar">
                <Navbar title="Cards Demo" onBack={() => props.navigation.goBack()} />
            </SharedElement>
            <div className="card-list">
            {
                Heroes.map((hero: Hero, index) => {
                    return (
                        <ButtonBase key={index} onClick={() => props.navigation.navigate('/details', {
                            profile: hero
                        })}>
                            <Card sx={{ width: 345 }}>
                                <SharedElement id={hero.id}>
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={hero.photo}
                                        alt={hero.name}
                                    />
                                </SharedElement>
                                <CardContent>
                                    <SharedElement id={`title-${hero.id}`}>
                                        <Typography gutterBottom variant="h5" component="h5">{hero.name}</Typography>
                                    </SharedElement>
                                    <p>{hero.description}</p>
                                </CardContent>
                            </Card>
                        </ButtonBase>
                    );
                })
            }
            </div>
        </div>
    );
}