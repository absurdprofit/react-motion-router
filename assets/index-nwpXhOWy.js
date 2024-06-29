/* LICENSES */
import{R as a,j as e,_ as B,B as _,a as d,g as f}from"./index-Q5pwu6fN.js";import{H as z}from"./Heroes-rLdVZhoo.js";import{C as L,a as F,b as N}from"./CardMedia-Iu-MrsWz.js";import{T as S}from"./Typography-5esMGHWY.js";import"./king-wJZ8uQj7.js";import"./extendSxProp-2837dfTk.js";let l="",g="",n="",u="",b="";const U=({observer:y,navigation:o,hero:t})=>{const i=a.useRef(null),j=a.useRef(null),R=a.useRef(null),v=a.useRef(null),P=a.useRef(null),w={...t,photoAspect:0},$=()=>{const c=v.current,m=R.current,x=j.current,C=i.current,I=P.current;if(c&&m&&x&&I&&C){const s=c.getBoundingClientRect(),p=m.getBoundingClientRect(),h=x.getBoundingClientRect();w.photoAspect=c.naturalWidth/c.naturalHeight,u=f(-h.top,-h.right,-h.bottom,-h.left),x.style.clipPath=u,l=f(-s.top,-s.right,-s.bottom,-s.left),c.style.clipPath=l,I.style.clipPath=l,b=f(-s.top,-s.right,-s.bottom,-s.left),C.style.clipPath=b,g=f(-p.top,-p.right,-p.bottom,-p.left),m.style.clipPath=g,n=t.id}};return e.jsx("li",{role:"menuitem",children:e.jsx(B,{href:"details",params:w,onClick:$,children:e.jsx(_,{"aria-label":`Character profile: ${t.name}`,disableRipple:!0,children:e.jsx(d,{id:`${t.id}-card-bg`,config:{deepClone:!1},children:e.jsx("div",{id:`${t.id}-card-bg`,className:"card-bg",ref:i,style:{width:345>window.screen.width?300:345,clipPath:n===t.id?b:""},children:e.jsxs(L,{sx:{width:345>window.screen.width?300:345},children:[e.jsx(d,{id:`${t.id}-gradient-overlay`,children:e.jsx("div",{ref:P,className:"gradient-overlay",style:{clipPath:n===t.id?l:""}})}),e.jsx(d,{id:t.id,children:e.jsx(F,{component:"img",height:345,loading:n===t.id?"eager":"lazy",decoding:n===t.id?"sync":"async",src:t.photoUrl,alt:t.name,id:`${t.id}`,ref:v,style:{clipPath:n===t.id?l:""}})}),e.jsxs(N,{style:{position:"absolute",bottom:"0"},children:[e.jsx(d,{id:`title-${t.id}`,config:{type:"fade-through"},children:e.jsx(S,{style:{clipPath:n===t.id?u:"",fontWeight:"bold",zIndex:10,margin:0,color:"white",position:"relative",fontSize:"28px"},ref:j,gutterBottom:!0,variant:"h4",component:"h4",children:t.name})}),e.jsx(d,{id:`description-${t.id}`,config:{type:"fade-through"},children:e.jsx("p",{ref:R,style:{fontSize:"16px",zIndex:10,color:"white",position:"relative",clipPath:n===t.id?g:""},children:t.description})})]})]})})})})})})},T=y=>{const o=z.map((t,i)=>e.jsx(U,{hero:t,...y},i));return e.jsx(e.Fragment,{children:o})};class r extends a.Component{static isFirstLoad=!1;ref=null;observer=new IntersectionObserver(this.observe.bind(this),{root:document.querySelector(".card-list")});static scrollPos={x:0,y:0};componentDidMount(){this.props.navigation.preloadRoute("details"),this.props.navigation.transition?.finished.then(()=>{r.isFirstLoad||(r.isFirstLoad=!0,this.forceUpdate()),this.props.navigation.current.url?.pathname==="/cards-2"&&(l="",g="",u="",this.forceUpdate())}),this.ref&&this.ref.scrollTo(r.scrollPos.x,r.scrollPos.y)}shouldComponentUpdate(){return!1}componentWillUnmount(){this.observer.disconnect(),this.ref&&(r.scrollPos={x:this.ref.scrollLeft,y:this.ref.scrollTop})}observe(o){for(let t of o){const i=t.target;t.isIntersecting?(i.loading="eager",i.decoding="sync"):(i.loading="lazy",i.decoding="async")}}render(){return e.jsx("div",{className:`cards cards-2 ${r.isFirstLoad?"loaded":"suspense"}`,children:e.jsx("ul",{role:"group","aria-label":"One Punch Man Series Characters",className:"card-list",ref:o=>this.ref=o,children:e.jsx(T,{...this.props,observer:this.observer})})})}}export{r as default};