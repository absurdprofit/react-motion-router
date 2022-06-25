import React from 'react';
import { Stack } from '../Stack';

class NotFound extends React.Component {
    render() {
        return (
            <div className="not-found">
                <h1>Not Found</h1>
            </div>
        );
    }
}

export default <Stack.Screen component={NotFound} in={true} out={false} />