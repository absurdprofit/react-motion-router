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
export default class Cards extends React.Component<CardsProps> {
    private ref: HTMLElement | null = null;

    private static scrollPos = {
        x: 0,
        y: 0
    }

    componentDidMount() {
        if (this.ref) {
            this.ref.scrollTo(Cards.scrollPos.x, Cards.scrollPos.y); // scroll restoration
        } 
    }

    componentWillUnmount() {
        if (this.ref) {
            Cards.scrollPos = {
                x: this.ref.scrollLeft,
                y: this.ref.scrollTop
            }
        }
    }

    render() {
        return (
            <div className="cards">
                <SharedElement id="navbar">
                    <Navbar title="Cards Demo" onBack={() => this.props.navigation.goBack()} />
                </SharedElement>
                <div className="card-list" ref={(ref: HTMLElement | null) => this.ref = ref}>
                {
                    Heroes.map((hero: Hero, index) => {
                        return (
                            <ButtonBase key={index} onClick={() => this.props.navigation.navigate('/details', {
                                profile: hero
                            })}>
                                <SharedElement id={`${hero.id}-card-bg`}>
                                    <div className="card-bg" style={{ width: 345 > window.screen.width ? 300 : 345 }}></div>
                                </SharedElement>
                                <Card sx={{ width: 345 > window.screen.width ? 300 : 345 }}>
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
                                        <SharedElement id={`description-${hero.id}`}>
                                            <p style={{
                                                fontSize: '16px'
                                            }}>{hero.description}</p>
                                        </SharedElement>
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
}