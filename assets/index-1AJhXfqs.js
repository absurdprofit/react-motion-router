/* LICENSES */
import{R as h,r as f,j as e,n as j,o as _,a as s,_ as b,I as v}from"./index-xTRlJpFc.js";import{d as w}from"./Clear-yWJ-Am_r.js";import{T as y}from"./Typography-DgvonC8R.js";import"./extendSxProp-NLlrLqR1.js";let g=!1,o,x="";function D(i){const d=h.useRef(null),[p,n]=h.useState(!1),{noBg:c,...t}=i.route.params;if(f.useEffect(()=>{var a,r;if(n(((a=d.current)==null?void 0:a.scrollTop)!==0),!t.name){i.navigation.goBack();return}if(x=t.name,t.description){o||(o=i.navigation.metaData.get("description"));const l=t.description;i.navigation.metaData.set("description",`${l.slice(0,102)}...`)}i.navigation.addEventListener("back",()=>{i.navigation.metaData.set("description",o),o=void 0},{once:!0,capture:!0}),(r=i.navigation.transition)==null||r.finished.then(()=>{g=!0})},[]),!t.name)return e.jsx(e.Fragment,{});const u=t.photoWidth/t.photoHeight;return e.jsx(j,{disabled:p,children:e.jsx(_,{id:"details-scroll-area",ref:d,shouldRestore:x===t.name,hashScrollConfig:{behavior:"smooth"},onScroll:a=>{if(!(a.target instanceof HTMLElement))return;const r=a.target.scrollTop,l=a.target.scrollHeight-a.target.clientHeight,m=r/l;n(m!==0)},children:e.jsxs("article",{"aria-label":`Character profile: ${t.name}`,className:`details ${g?"loaded":"suspense"}`,style:{width:"100%",height:"100%",backgroundColor:c?"white":void 0},children:[!c&&e.jsx(s,{id:`${t.id}-card-bg`,children:e.jsx("div",{className:"card-bg","aria-hidden":"true"})}),e.jsx(b,{"aria-label":"Go Back",goBack:!0,tabIndex:-1,children:e.jsx(v,{style:{position:"absolute",color:"grey",zIndex:1e4},disableRipple:!0,children:e.jsx(s,{id:"back",config:{type:"fade-through"},children:e.jsx(w,{style:{zIndex:100}})})})}),e.jsxs("div",{className:"profile-info",children:[e.jsx(s,{id:`${t.id}-gradient-overlay`,children:e.jsx("div",{className:"gradient-overlay",style:{height:window.innerWidth/u,width:window.innerWidth},"aria-hidden":"true"})}),e.jsx(s,{id:t.id,children:e.jsx("img",{src:t.photoUrl,alt:"Character",width:t.photoWidth,height:t.photoHeight})}),e.jsxs("div",{className:"text-content",tabIndex:0,children:[e.jsx(s,{id:`title-${t.id}`,children:e.jsx(y,{id:"title",style:{fontWeight:"bold",fontSize:"28px",zIndex:10},gutterBottom:!0,variant:"h4",component:"h4",children:t.name})}),e.jsx("div",{className:"description",children:e.jsx(s,{id:`description-${t.id}`,children:e.jsx("p",{style:{zIndex:10},children:t.description})})})]})]})]})})})}export{D as default};
