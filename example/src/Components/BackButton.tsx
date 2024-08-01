import { IconButton } from "@mui/material";
import { Anchor, SharedElement } from "@react-motion-router/core";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

export default function BackButton() {
    return (
        <Anchor goBack>
            <IconButton disableRipple>
                <SharedElement id="back">
                    <ArrowBackIosIcon style={{zIndex: 100}} />
                </SharedElement>
            </IconButton>
        </Anchor>
    );
}