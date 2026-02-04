import React, { memo } from 'react';
import { SharedElement } from '@react-motion-router/core';
import './index.css';
import BackButton from '../BackButton';
import { useNavigation, useRoute } from '@react-motion-router/stack';

interface NavbarProps {
    title: string;
}
function Navbar(props: NavbarProps) {
  const navigation = useNavigation();
  const route = useRoute<{ count: number }>();
  const { count = 0 } = route.params;
  const setCount = (count: number) => {
    route.setParams({ count });
  };
  const clearCount = () => {
    route.setParams({ count: 0 });
  };

  return (
    <SharedElement.div id="navbar" className='navbar' config={{
      type: 'fade',
    }}>
      <div className="back">
        {
          navigation.canGoBack()
            ? <BackButton />
            :                            undefined
        }
      </div>
      <div className="title">
        <SharedElement.h2 id={props.title.toLowerCase().split(' ').join('-') + '-title'}>
          {props.title} - {count}
        </SharedElement.h2>
        <button onClick={() => setCount(count + 1)}>Inc</button>
        <button onClick={() => clearCount()}>Clear</button>
      </div>
    </SharedElement.div>
  );
}

export default memo(Navbar);