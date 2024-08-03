import React from 'react';

import * as Stack from "@react-motion-router/stack";
import Home from "./Home";
import Player from "./Player";
import Sheet from "./Sheet";
import { useEffect } from "react";
import { HomeAnimation, PlayerAnimation, SheetAnimation } from "./animations";
import './index.css';
import { isIOS, isPWA } from "../../common/utils";

interface OverlaysProps extends Stack.ScreenComponentProps { }
let isFirstLoad = false;
export default function Overlays(props: OverlaysProps) {
    useEffect(() => {
        props.navigation.addEventListener('navigate', (e) => {
            e.signal.addEventListener('abort', () => {
                console.log("Aborted");
            });
        }, { once: true, capture: true });

        props.navigation.transition?.finished.then(() => isFirstLoad = true);
        document.body.style.backgroundColor = 'rgba(254, 226, 85)';

        return () => {
            document.body.style.backgroundColor = 'unset';
        }
    }, [props.navigation]);

    const modalConfig: Stack.ScreenProps["config"] = {
        gestureDirection: 'down',
        gestureAreaWidth: window.innerHeight / 1.5,
        gestureDisabled: false,
        gestureHysteresis: .15,
        presentation: "modal"
    } as const;
    return (
        <div className={`overlays ${isFirstLoad ? 'loaded' : 'suspense'}`}>
            <div style={{ position: "absolute", width: "100vw", height: "100vh" }}>
                <Stack.Router config={{
                    disableBrowserRouting: isPWA() && isIOS(),
                    initialPath: '.'
                }}>
                    <Stack.Screen component={Home} path="." config={{
                        animation: HomeAnimation,
                        keepAlive: true
                    }} />
                    <Stack.Screen component={Player} path="player" config={{
                        ...modalConfig,
                        animation: PlayerAnimation
                    }} />
                    <Stack.Screen
                        component={Sheet}
                        path="sheet"
                        config={{
                            ...modalConfig,
                            presentation: "dialog",
                            animation: SheetAnimation
                        }}
                    />
                </Stack.Router>
            </div>
        </div>
    );
}