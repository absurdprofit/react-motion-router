import React from 'react';
import { SharedElement } from '@react-motion-router/core';
import { Navigation, Stack } from '@react-motion-router/stack';
import BoredSaitama from '../assets/bored-saitama.gif';
import Button from '@mui/material/Button';
import '../css/NotFound.css';
import Navbar from '../Components/Navbar';

interface NotFoundProps extends Stack.ScreenComponentProps {}

export default function NotFound(props: NotFoundProps) {
    const imgWidth = window.screen.width > 400 ? 400 : window.screen.width;
    return (
        <div className="not-found">
            <div className="page-content">
                <h1>404 Not Found</h1>
                <img src={BoredSaitama} alt="gif" style={{width: imgWidth, height: imgWidth / 1.16}} />
                <Button variant="contained" onClick={() => props.navigation.navigate('/')}>Home</Button>
            </div>
        </div>
    );
}