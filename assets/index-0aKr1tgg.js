/* LICENSES */
var L=Object.defineProperty;var F=(r,i,t)=>i in r?L(r,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[i]=t;var h=(r,i,t)=>(F(r,typeof i!="symbol"?i+"":i,t),t);import{R as c,j as e,_ as N,B as S,a as f,g as m}from"./index-sZVmdG-D.js";import{H as U}from"./Heroes-rLdVZhoo.js";import{C as T,a as k,b as A}from"./CardMedia-I4BBloZ7.js";import{T as H}from"./Typography-ag8ckkYn.js";import"./king-wJZ8uQj7.js";import"./extendSxProp-0xRUzmDI.js";let d="",x="",a="",b="",R="";const M=({observer:r,navigation:i,hero:t})=>{const s=c.useRef(null),l=c.useRef(null),v=c.useRef(null),P=c.useRef(null),C=c.useRef(null),w={...t,photoAspect:0},z=()=>{const p=P.current,y=v.current,j=l.current,I=s.current,$=C.current;if(p&&y&&j&&$&&I){const o=p.getBoundingClientRect(),g=y.getBoundingClientRect(),u=j.getBoundingClientRect();w.photoAspect=p.naturalWidth/p.naturalHeight,b=m(-u.top,-u.right,-u.bottom,-u.left),j.style.clipPath=b,d=m(-o.top,-o.right,-o.bottom,-o.left),p.style.clipPath=d,$.style.clipPath=d,R=m(-o.top,-o.right,-o.bottom,-o.left),I.style.clipPath=R,x=m(-g.top,-g.right,-g.bottom,-g.left),y.style.clipPath=x,a=t.id}};return e.jsx("li",{role:"menuitem",children:e.jsx(N,{href:"/details",params:w,onClick:z,children:e.jsxs(S,{"aria-label":`Character profile: ${t.name}`,disableRipple:!0,children:[e.jsx(f,{id:`${t.id}-card-bg`,children:e.jsx("div",{id:`${t.id}-bg`,className:"card-bg",ref:s,style:{width:345>window.screen.width?300:345,clipPath:a===t.id?R:""}})}),e.jsxs(T,{sx:{width:345>window.screen.width?300:345},children:[e.jsx(f,{id:`${t.id}-gradient-overlay`,children:e.jsx("div",{ref:C,className:"gradient-overlay",style:{clipPath:a===t.id?d:""}})}),e.jsx(f,{id:t.id,children:e.jsx(k,{component:"img",height:345,loading:a===t.id?"eager":"lazy",decoding:a===t.id?"sync":"async",src:t.photoUrl,alt:t.name,id:`${t.id}`,ref:P,style:{clipPath:a===t.id?d:""}})}),e.jsxs(A,{style:{position:"absolute",bottom:"0",color:"white"},children:[e.jsx(f,{id:`title-${t.id}`,config:{type:"fade-through"},children:e.jsx(H,{style:{clipPath:a===t.id?b:"",fontWeight:"bold",zIndex:10,margin:0,position:"relative",fontSize:"28px"},ref:l,gutterBottom:!0,variant:"h4",component:"h4",children:t.name})}),e.jsx(f,{id:`description-${t.id}`,config:{type:"fade-through"},children:e.jsx("p",{ref:v,style:{fontSize:"16px",zIndex:10,position:"relative",clipPath:a===t.id?x:""},children:t.description})})]})]})]})})})},W=r=>{const i=U.map((t,s)=>e.jsx(M,{hero:t,...r},s));return e.jsx(e.Fragment,{children:i})},n=class n extends c.Component{constructor(){super(...arguments);h(this,"ref",null);h(this,"observer",new IntersectionObserver(this.observe.bind(this),{root:document.querySelector(".card-list")}))}componentDidMount(){var t;this.props.navigation.preloadRoute("/details"),(t=this.props.navigation.transition)==null||t.finished.then(()=>{var s;n.isFirstLoad||(n.isFirstLoad=!0,this.forceUpdate()),((s=this.props.navigation.current.url)==null?void 0:s.pathname)==="/cards-2"&&(d="",x="",b="",this.forceUpdate())}),this.ref&&this.ref.scrollTo(n.scrollPos.x,n.scrollPos.y)}shouldComponentUpdate(){return!1}componentWillUnmount(){this.observer.disconnect(),this.ref&&(n.scrollPos={x:this.ref.scrollLeft,y:this.ref.scrollTop})}observe(t){for(let s of t){const l=s.target;s.isIntersecting?(l.loading="eager",l.decoding="sync"):(l.loading="lazy",l.decoding="async")}}render(){return e.jsx("div",{className:`cards cards-2 ${n.isFirstLoad?"loaded":"suspense"}`,children:e.jsx("ul",{role:"group","aria-label":"One Punch Man Series Characters",className:"card-list",ref:t=>this.ref=t,children:e.jsx(W,{...this.props,observer:this.observer})})})}};h(n,"isFirstLoad",!1),h(n,"scrollPos",{x:0,y:0});let B=n;export{B as default};
