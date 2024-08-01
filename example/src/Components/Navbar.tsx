import React, {memo} from 'react';
import { SharedElement, useNavigation, useRoute } from '@react-motion-router/core';
import '../css/Navbar.css';
import BackButton from './BackButton';

interface NavbarProps {
    title: string;
}
function Navbar(props: NavbarProps) {
    const navigation = useNavigation();
    const route = useRoute();
    const [canGoBack, setCanGoBack] = React.useState<boolean>(navigation.canGoBack() && route.path !== "/");

    React.useEffect(() => {
        setCanGoBack(navigation.canGoBack() && route.path !== "/");
    }, [navigation, route.path]);
    return (
        <SharedElement id="navbar" config={{
            type: 'fade'
        }}>
            <div className="navbar">
                <div className="back">
                    {
                        canGoBack ?
                        <BackButton />
                        :
                        undefined
                    }
                </div>
                <div className="title">
                    <SharedElement id={props.title.toLowerCase().split(' ').join('-') + "-title"} config={{transformOrigin: 'center center'}}>
                        <h2>{props.title}</h2>
                    </SharedElement>
                </div>
            </div>
        </SharedElement>
    );
}

export default memo(Navbar);