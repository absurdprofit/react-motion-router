/* LICENSES */
import{R as a,j as e,_ as w,B,a as f,g as u}from"./index-3bpjAscX.js";import{H as I}from"./Heroes-rLdVZhoo.js";import{C as $,a as _,b as L}from"./CardMedia-MXFAVlFg.js";import{T as S}from"./Typography-FcvzKCwM.js";import"./king-wJZ8uQj7.js";import"./extendSxProp-arkIxXoj.js";let g="",h="",j="",r="",m="";const z=({observer:c,navigation:o,hero:t})=>{const s=a.useRef(null),R=a.useRef(null),v=a.useRef(null),n=a.useRef(null);a.useEffect(()=>(n.current&&c.observe(n.current),()=>{n.current&&c.unobserve(n.current)}),[n,c]);const P=()=>{const x=n.current,b=v.current,y=R.current,C=s.current;if(x&&b&&y&&C){const i=x.getBoundingClientRect(),d=b.getBoundingClientRect(),p=y.getBoundingClientRect();m=u(-p.top,-p.right,-p.bottom,-p.left),y.style.clipPath=m,g=u(-i.top,-i.right,-i.bottom,-i.left),x.style.clipPath=g,j=u(-i.top,-i.right,-i.bottom,-i.left),C.style.clipPath=j,h=u(-d.top,-d.right,-d.bottom,-d.left),b.style.clipPath=h,r=t.id}};return e.jsx("li",{role:"menuitem",children:e.jsx(w,{href:"details",params:{...t},onClick:P,children:e.jsx(B,{"aria-label":`Character profile: ${t.name}`,disableRipple:!0,children:e.jsx(f,{id:`${t.id}-card-bg`,config:{deepClone:!1},children:e.jsx("div",{id:`${t.id}-card-bg`,className:"card-bg",ref:s,style:{width:345>window.screen.width?300:345,clipPath:r===t.id?j:""},children:e.jsxs($,{sx:{width:345>window.screen.width?300:345},children:[e.jsx(f,{id:t.id,children:e.jsx(_,{component:"img",height:"140",loading:r===t.id?"eager":"lazy",decoding:r===t.id?"sync":"async",src:t.photoUrl,alt:t.name,id:`${t.id}`,ref:n,style:{clipPath:r===t.id?g:""}})}),e.jsxs(L,{children:[e.jsx(f,{id:`title-${t.id}`,children:e.jsx(S,{style:{clipPath:r===t.id?m:"",fontWeight:"bold",margin:0,fontSize:"28px"},ref:R,gutterBottom:!0,variant:"h4",component:"h4",children:t.name})}),e.jsx(f,{id:`description-${t.id}`,children:e.jsx("p",{ref:v,style:{fontSize:"16px",clipPath:r===t.id?h:""},children:t.description})})]})]})})})})})})},F=c=>{const o=I.map((t,s)=>e.jsx(z,{hero:t,...c},s));return e.jsx(e.Fragment,{children:o})};class l extends a.Component{static isFirstLoad=!1;ref=null;observer=new IntersectionObserver(this.observe.bind(this),{root:document.querySelector(".card-list")});static scrollPos={x:0,y:0};componentDidMount(){this.props.navigation.transition?.finished.then(()=>{l.isFirstLoad=!0,this.props.navigation.current.url?.pathname==="/cards"&&(g="",h="",m=""),this.forceUpdate()}),this.ref&&this.ref.scrollTo(l.scrollPos.x,l.scrollPos.y)}shouldComponentUpdate(){return!1}componentWillUnmount(){this.observer.disconnect(),this.ref&&(l.scrollPos={x:this.ref.scrollLeft,y:this.ref.scrollTop})}observe(o){for(let t of o){const s=t.target;t.isIntersecting?(s.loading="eager",s.decoding="sync"):(s.loading="lazy",s.decoding="async")}}render(){return e.jsx("div",{className:`cards ${l.isFirstLoad?"loaded":"suspense"}`,children:e.jsx("ul",{role:"group","aria-label":"One Punch Man Series Characters",className:"card-list",ref:o=>this.ref=o,children:e.jsx(F,{...this.props,observer:this.observer})})})}}export{l as default};
