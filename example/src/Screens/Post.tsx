import React from 'react';
import {Navigation, SharedElement} from 'react-motion-router';

interface PostProps {
    navigation: Navigation;
    route: {
        params: {
            [key:string]:any;
        }
    };
}

export default class Post extends React.Component<PostProps, {}> {
    render() {
        if (this.props.route.params.post) {
            return (
                <div className="post">
                    <button style={{position: "absolute"}} onClick={() => {this.props.navigation.go_back()}}>Back</button>
                    <div className="picture">
                        <SharedElement id={this.props.route.params.post.id}>
                            <img src={this.props.route.params.post.picture} alt="post" />
                        </SharedElement>
                    </div>
                    <div className="text">
                        <div className="title">
                            <SharedElement id={`title-${this.props.route.params.post.id}`}>
                                <h1>{this.props.route.params.post.title}</h1>
                            </SharedElement>
                        </div>
                        <div className="content">
                            <p>{this.props.route.params.post.description}</p>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <></>
        }
    }
}