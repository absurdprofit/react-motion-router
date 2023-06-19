import { IconButton } from "@mui/material";
import { Anchor } from "@react-motion-router/core";
import { Router, Stack } from "@react-motion-router/stack";
import Home from "./Home";
import Player from "./Modals/Player";
import Sheet from "./Modals/Sheet";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useEffect } from "react";
import { ModalAnimation, OverlaysAnimation } from "./Animations";
import '../../css/Modal.css';
import { iOS, isPWA } from "../..//common/utils";

let isLoaded = false;
export default function Overlays() {
    useEffect(() => {
        window.addEventListener('navigate', (e) => {
            e.detail.signal.addEventListener('abort', () => {
                console.log("Aborted");
            });
        }, {once: true, capture: true});
        
        window.addEventListener('page-animation-end', () => isLoaded = true, {once: true});
        document.body.style.backgroundColor = 'rgba(254, 226, 85)';

        return () => {
            document.body.style.backgroundColor = 'unset';
        }
    }, []);

    const onProgress = (progress: number) => {
        // console.log(progress);
    }
    const modalConfig = {
        swipeDirection: 'down',
        swipeAreaWidth: window.innerHeight / 1.5,
        animation: ModalAnimation,
        disableDiscovery: false,
        hysteresis: 15
    } as const;
    return (
        <div className={`overlays ${isLoaded ? 'loaded' : 'suspense'}`}>
            <div className="go-back">
                <Anchor goBack>
                    <IconButton disableRipple>
                        <ArrowBackIosIcon style={{zIndex: 100}} />
                    </IconButton>
                </Anchor>
            </div>
            <div style={{position: "absolute", width: "100vw", height: "100vh"}}>
                <Router config={{
                    disableBrowserRouting: isPWA() && iOS(),
                }}>
                    <Stack.Screen component={Home} path="/" config={{keepAlive: true}} />
                    <Stack.Screen component={Player} path="/player" config={modalConfig} defaultParams={{onProgress}} />
                    <Stack.Screen component={Sheet} path="/sheet" config={modalConfig} defaultParams={{onProgress}} />
                </Router>
            </div>
        </div>
    );
}