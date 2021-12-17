import React from 'react';
import Anchor from '../Navigation/Anchor';
import {Navigation} from '../Navigation';
import ProfilePicture from '../assets/profile-picture.jpg';
import PostPicture from '../assets/post-picture.png';
import Tiles from './Tiles';
import {SharedElement} from '../Navigation';

interface HomeProps {
    navigation: Navigation;
}
export default function Home(props: HomeProps) {
    const profile = {
        id: "0",
        photo: ProfilePicture,
        name: "Elon Musk",
        description: "Ea dolore incididunt deserunt do occaecat incididunt consequat. Proident adipisicing sunt minim quis officia in anim. Velit adipisicing tempor adipisicing aliqua id nisi occaecat magna laboris. Eiusmod excepteur amet amet exercitation tempor reprehenderit occaecat deserunt adipisicing nostrud ullamco aliqua voluptate. Enim consequat tempor do sit pariatur Lorem pariatur."
    };
    const post ={
        id: "1",
        title: 'Post',
        picture: PostPicture,
        description: "Do adipisicing sint consequat fugiat laborum adipisicing occaecat minim id ex est elit. Tempor est aliquip sit labore do. Id do labore duis reprehenderit deserunt duis amet do non anim laborum do ea eiusmod. Elit aliqua aliquip anim minim laboris labore ea tempor. Nulla fugiat ex laboris minim. Pariatur excepteur aliqua ad Lorem excepteur. Enim consectetur ad proident quis commodo exercitation do."
    }
    return (
        <div style={{width: "100vw", height: "100vh"}}>
            <h1>Home</h1>
            <Anchor onClick={() => props.navigation.navigate("/details", {
                profile: profile
            })} href="/details">
                <div className="profile-card">
                    <SharedElement id={profile.id}>
                        <img src={profile.photo} alt="profile-home" />
                    </SharedElement>
                    <div className="profile-description">
                        <h3>{profile.name}</h3>
                        <p>{profile.description}</p>
                    </div>
                </div>
            </Anchor>
            <Anchor href="/post" onClick={() => props.navigation.navigate('/post', {post: post})}>
                <div className="post-card">
                        <div className="post-title">
                            <h3>{post.title}</h3>
                        </div>
                        <SharedElement id={post.id}>
                            <img src={post.picture} alt="post" />
                        </SharedElement>
                        <div className="post-description">
                            <p>{post.description}</p>                        
                        </div>
                    </div>
            </Anchor>
            <Anchor href="tiles" onClick={() => props.navigation.navigate('/tiles')}>
                <button>
                    <h1>Tiles Demo</h1>
                </button>
            </Anchor>
            <Tiles navigation={props.navigation} />
        </div>
    )
}