/* LICENSES */
import{j as e,_ as n,r as l}from"./index-Q5pwu6fN.js";import{B as d}from"./Button-bDc8HGO1.js";function o(i){return e.jsx("li",{role:"menuitem",children:e.jsx(n,{href:i.href,children:e.jsx(d,{tabIndex:-1,children:e.jsxs("div",{className:"list-item",children:[e.jsx("div",{className:"title",children:e.jsx("h2",{children:i.title})}),e.jsx("div",{className:"description",children:e.jsx("p",{children:i.description})})]})})})})}let t=!1;function m(i){const r=[{title:"Tiles Demo",description:"Image tiles that zoom-in and then allow gestures to paginate and dismiss",href:"tiles"},{title:"Cards Demo",description:"Card reveal with shared element transitions",href:"cards"},{title:"Cards Demo 2",description:"Heavier card demo with fading gradient overlay and cross-fading texts",href:"cards-2"},{title:"Overlay Demo",description:"Various Overlays such as modals with spring and default timing functions",href:"overlays/"}];return l.useEffect(()=>{i.navigation.transition?.finished.then(()=>{t=!0})},[]),e.jsx("div",{className:`home ${t?"loaded":"suspense"}`,children:e.jsx("ul",{className:"list",role:"group","aria-label":"Available Demos",children:r.map((s,a)=>e.jsx(o,{href:s.href,title:s.title,description:s.description},a))})})}export{m as default};