/* LICENSES */
import{R as c,r as h,j as e,n as g,a,_ as p,I as x}from"./index-Q5pwu6fN.js";import{d as u}from"./Clear-Z624T3MA.js";import{T as f}from"./Typography-5esMGHWY.js";import"./extendSxProp-2837dfTk.js";let n=!1,s,m="";function w(i){const[o,b]=c.useState(!1),{noBg:r,...t}=i.route.params;if(h.useEffect(()=>{if(!t.name){i.navigation.goBack();return}if(m=t.name,t.description){s||(s=i.navigation.metaData.get("description"));const l=t.description;i.navigation.metaData.set("description",`${l.slice(0,102)}...`)}i.navigation.addEventListener("back",()=>{i.navigation.metaData.set("description",s),s=void 0},{once:!0,capture:!0}),i.navigation.transition?.finished.then(()=>{n=!0})},[]),!t.name)return e.jsx(e.Fragment,{});const d=t.photoWidth/t.photoHeight;return e.jsx(g,{disabled:o,children:e.jsx("article",{"aria-label":`Character profile: ${t.name}`,className:`details ${n?"loaded":"suspense"}`,style:{width:"100%",height:"100%",backgroundColor:r?"white":void 0},children:e.jsx(a,{id:`${t.id}-card-bg`,config:{styles:["background-color","border-radius"],deepClone:!1},disabled:r,children:e.jsxs("div",{className:"card-bg","aria-hidden":"true",children:[e.jsx(p,{"aria-label":"Go Back",goBack:!0,tabIndex:-1,children:e.jsx(x,{style:{position:"absolute",color:"grey",zIndex:1e4},disableRipple:!0,children:e.jsx(a,{id:"back",config:{type:"fade-through",styles:["color"]},children:e.jsx(u,{style:{zIndex:100}})})})}),e.jsxs("div",{className:"profile-info",children:[e.jsx(a,{id:`${t.id}-gradient-overlay`,config:{styles:["background","opacity","clip-path","border-radius"]},children:e.jsx("div",{className:"gradient-overlay",style:{height:window.innerWidth/d,width:window.innerWidth},"aria-hidden":"true"})}),e.jsx(a,{id:t.id,config:{styles:["object-fit","border-radius"]},children:e.jsx("img",{src:t.photoUrl,alt:"Character",width:t.photoWidth,height:t.photoHeight})}),e.jsxs("div",{className:"text-content",tabIndex:0,children:[e.jsx(a,{id:`title-${t.id}`,children:e.jsx(f,{id:"title",style:{fontWeight:"bold",fontSize:"28px",zIndex:10},gutterBottom:!0,variant:"h4",component:"h4",children:t.name})}),e.jsx("div",{className:"description",children:e.jsx(a,{id:`description-${t.id}`,config:{styles:["clip-path","text-align","overflow","line-height"]},children:e.jsx("p",{style:{zIndex:10},children:t.description})})})]})]})]})})})})}export{w as default};