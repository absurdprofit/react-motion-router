/* LICENSES */
import{b as T,c as B,s as W,o as u,d as i,r as C,u as M,f as R,j as P,h as j,i as U}from"./index-UtmmjX7-.js";import{e as N}from"./extendSxProp-_LOGohsc.js";function _(t){return T("MuiTypography",t)}B("MuiTypography",["root","h1","h2","h3","h4","h5","h6","subtitle1","subtitle2","body1","body2","inherit","button","caption","overline","alignLeft","alignRight","alignCenter","alignJustify","noWrap","gutterBottom","paragraph"]);const $=["align","className","component","gutterBottom","noWrap","paragraph","variant","variantMapping"],E=t=>{const{align:a,gutterBottom:o,noWrap:n,paragraph:e,variant:r,classes:p}=t,s={root:["root",r,t.align!=="inherit"&&`align${u(a)}`,o&&"gutterBottom",n&&"noWrap",e&&"paragraph"]};return U(s,_,p)},L=W("span",{name:"MuiTypography",slot:"Root",overridesResolver:(t,a)=>{const{ownerState:o}=t;return[a.root,o.variant&&a[o.variant],o.align!=="inherit"&&a[`align${u(o.align)}`],o.noWrap&&a.noWrap,o.gutterBottom&&a.gutterBottom,o.paragraph&&a.paragraph]}})(({theme:t,ownerState:a})=>i({margin:0},a.variant&&t.typography[a.variant],a.align!=="inherit"&&{textAlign:a.align},a.noWrap&&{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},a.gutterBottom&&{marginBottom:"0.35em"},a.paragraph&&{marginBottom:16})),y={h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",h6:"h6",subtitle1:"h6",subtitle2:"h6",body1:"p",body2:"p",inherit:"p"},z={primary:"primary.main",textPrimary:"text.primary",secondary:"secondary.main",textSecondary:"text.secondary",error:"error.main"},A=t=>z[t]||t,D=C.forwardRef(function(a,o){const n=M({props:a,name:"MuiTypography"}),e=A(n.color),r=N(i({},n,{color:e})),{align:p="inherit",className:s,component:g,gutterBottom:d=!1,noWrap:f=!1,paragraph:l=!1,variant:h="body1",variantMapping:c=y}=r,x=R(r,$),m=i({},r,{align:p,color:e,className:s,component:g,gutterBottom:d,noWrap:f,paragraph:l,variant:h,variantMapping:c}),v=g||(l?"p":c[h]||y[h])||"span",b=E(m);return P.jsx(L,i({as:v,ref:o,ownerState:m,className:j(b.root,s)},x))}),V=D;export{V as T};