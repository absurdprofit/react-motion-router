import React from 'react';

export default function GestureRegion(props: any) {
    return (
        <div className="gesture-region" style={{display: 'contents'}}>{props.children}</div>
    );
}