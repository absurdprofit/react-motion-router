/* LICENSES */
import{a4 as st}from"./index-eSz3uT21.js";function wt(n){function t(e){return!!e}return t(n)&&(typeof n.type=="string"||typeof n.type=="symbol")}function Le(n,t){if(!wt(n))throw new Error("Expected event");if(typeof t<"u"&&n.type!==t)throw new Error(`Expected event type ${String(t)}, got ${n.type.toString()}`)}function De(n){return wt(n)&&n.parallel!==!1}class oe extends Error{constructor(t){super(`AbortError${t?`: ${t}`:""}`),this.name="AbortError"}}function se(n){return n instanceof Error&&n.name==="AbortError"}class I extends Error{constructor(t){super(`InvalidStateError${t?`: ${t}`:""}`),this.name="InvalidStateError"}}function Oe(n){return n instanceof Error&&n.name==="InvalidStateError"}function Re(n){function t(e){return typeof e=="object"}return t(n)&&typeof n.aborted=="boolean"&&typeof n.addEventListener=="function"}function at(n){function t(e){return e.hasOwnProperty("signal")}return wt(n)&&t(n)&&Re(n.signal)}function zt(n,t){if(at(n)&&n.signal.aborted&&t instanceof Error&&se(t))return!0}const $=Symbol.for("@opennetwork/environment/events/target/listeners"),bt=Symbol.for("@opennetwork/environment/events/target/listeners/ignore"),ae=Symbol.for("@opennetwork/environment/events/target/listeners/match"),Tt=Symbol.for("@opennetwork/environment/events/target/listeners/this"),Ot=Symbol.for("@opennetwork/environment/events/descriptor");function rt(n,t,e){const i=r(e)?e:void 0;return o=>i?i===o:(!t||t===o.callback)&&n===o.type;function r(o){function a(s){return!!s}return a(o)&&o[Ot]===!0}}function kt(n){return typeof n=="function"}const F=Symbol.for("@virtualstate/navigation/event-target/descriptors");class Ue{[F]=[];[bt]=new WeakSet;get[$](){return[...this[F]??[]]}[ae](t){const e=this[$],i=[...new Set([...e??[],...this[F]??[]])].filter(o=>o.type===t||o.type==="*").filter(o=>!this[bt]?.has(o)),r=typeof t=="string"?this[`on${t}`]:void 0;return typeof r=="function"&&kt(r)&&i.push({type:t,callback:r,[Ot]:!0}),i}addEventListener(t,e,i){const r={...i,isListening:()=>!!this[F]?.find(rt(t,e)),descriptor:{[Ot]:!0,...i,type:t,callback:e},timestamp:Date.now()};r.isListening()||this[F]?.push(r.descriptor)}removeEventListener(t,e,i){if(!kt(e))return;const r=this[$]??this[F]??[],o=r.findIndex(rt(t,e,i));if(o===-1)return;const a=this[F]?.findIndex(rt(t,e,i))??-1;a!==-1&&this[F]?.splice(a,1);const s=r[o];s&&this[bt]?.add(s)}hasEventListener(t,e){return e&&!kt(e)?!1:(this[F]?.findIndex(rt(t,e))??-1)>-1}}class ct extends Ue{[Tt];constructor(t=void 0){super(),this[Tt]=t}async dispatchEvent(t){const e=this[ae]?.(t.type)??[];if(at(t)&&t.signal.aborted)throw new oe;const i=De(t),r=[];for(let o=0;o<e.length;o+=1){const a=e[o],s=(async()=>{a.once&&this.removeEventListener(a.type,a.callback,a),await a.callback.call(this[Tt]??this,t)})();if(i)r.push(s);else{try{await s}catch(c){zt(t,c)||await Promise.reject(c)}if(at(t)&&t.signal.aborted)return}}if(r.length){const a=(await Promise.allSettled(r)).filter(s=>s.status==="rejected");if(a.length){let s=a;if(at(t)&&t.signal.aborted&&(s=s.filter(c=>!zt(t,c.reason))),s.length===1)throw await Promise.reject(s[0].reason),s[0].reason;if(s.length>1)throw new AggregateError(s.map(({reason:c})=>c))}}}}const Ae={EventTarget:ct,AsyncEventTarget:ct,SyncEventTarget:ct};let xt=Ae;const It=xt.EventTarget||xt.SyncEventTarget||xt.AsyncEventTarget;function je(n){if(typeof n!="function")throw new Error("Could not load EventTarget implementation")}class ce extends ct{constructor(...t){if(super(),It){je(It);const{dispatchEvent:e}=new It(...t);this.dispatchEvent=e}}}function bn(n){function t(e){return wt(e)}return t(n)&&typeof n.intercept=="function"}class ue extends ce{addEventListener(t,e,i){return r(e),super.addEventListener(t,e,typeof i=="boolean"?{once:i}:i);function r(o){if(typeof o!="function")throw new Error("Please us the function variant of event listener")}}removeEventListener(t,e,i){return r(e),super.removeEventListener(t,e);function r(o){if(typeof o!="function")throw new Error("Please us the function variant of event listener")}}}const fe={v4(){return Array.from({length:5},()=>`${Math.random()}`.replace(/^0\./,"")).join("-").replace(".","")}};async function _e(){const{v4:n}=await st(()=>import("./import-uuid-E8hlVLGV.js"),__vite__mapDeps([])).catch(async()=>{const t=await st(()=>import("./__vite-browser-external-5n_Q6CfD.js"),__vite__mapDeps([]));return{v4(){return t.randomUUID()}}}).catch(async()=>st(()=>import("./index-MNNG-goJ.js"),__vite__mapDeps([]))).catch(()=>{}).then(t=>t??fe);return{v4:n}}const Fe=await _e(),He=()=>Fe;function lt(){const n=He();return n?.v4?n.v4():fe.v4()}const Bt=Symbol.for("@virtualstate/navigation/getState"),Rt=Symbol.for("@virtualstate/navigation/entry/navigationType"),ht=Symbol.for("@virtualstate/navigation/entry/knownAs"),le=Symbol.for("@virtualstate/navigation/entry/setState");function he(n){return typeof n=="number"||typeof n=="boolean"||typeof n=="symbol"||typeof n=="bigint"||typeof n=="string"}function Jt(n){return!!(n||he(n))}class Nt extends ue{#n;#t;get index(){return typeof this.#n=="number"?this.#n:this.#n()}key;id;url;sameDocument;get[Rt](){return this.#i.navigationType}get[ht](){const t=new Set(this.#i[ht]);return t.add(this.id),t}#i;get[$](){return[...super[$]??[],...this.#i[$]??[]]}constructor(t){super(),this.#i=t,this.key=t.key||lt(),this.id=lt(),this.url=t.url??void 0,this.#n=t.index,this.sameDocument=t.sameDocument??!0,this.#t=t.state??void 0}[Bt](){return this.#i?.getState?.(this)}getState(){let t=this.#t;if(!Jt(t)){const e=this[Bt]();Jt(e)&&(t=this.#t=e)}return typeof t>"u"||he(t)?t:(typeof t=="function"&&(console.warn("State passed to Navigation.navigate was a function, this may be unintentional"),console.warn("Unless a state value is primitive, with a standard implementation of Navigation"),console.warn("your state value will be serialized and deserialized before this point, meaning"),console.warn("a function would not be usable.")),{...t})}[le](t){this.#t=t}}function Yt(n){let t,e;const i=new Promise((r,o)=>{t=r,e=o});return Qt(t),Qt(e),{resolve:t,reject:e,promise:n?i.catch(n):i}}function Qt(n){if(!n)throw new Error("Value not provided")}const de=typeof AbortController<"u"?AbortController:void 0;if(!de)throw new Error("AbortController expected to be available or polyfilled");const ge=de;function pe(n){return K(n)&&typeof n.then=="function"}function q(n,t="Expected value"){if(!n)throw new Error(t)}function Me(n){return n.status==="rejected"}function K(n){return!!n}const Y=Symbol.for("@virtualstate/navigation/rollback"),Xt=Symbol.for("@virtualstate/navigation/unset"),Ut=Symbol.for("@virtualstate/navigation/transition/parentEventTarget"),M=Symbol.for("@virtualstate/navigation/transition/deferred/finished"),_=Symbol.for("@virtualstate/navigation/transition/deferred/committed"),nt=Symbol.for("@virtualstate/navigation/transition/navigationType"),it=Symbol.for("@virtualstate/navigation/transition/entries/initial"),Pt=Symbol.for("@virtualstate/navigation/transition/entries/finished"),dt=Symbol.for("@virtualstate/navigation/transition/index/initial"),Ct=Symbol.for("@virtualstate/navigation/transition/index/finished"),R=Symbol.for("@virtualstate/navigation/transition/entry"),Zt=Symbol.for("@virtualstate/navigation/transition/isCommitted"),ot=Symbol.for("@virtualstate/navigation/transition/isFinished"),Lt=Symbol.for("@virtualstate/navigation/transition/isRejected"),ut=Symbol.for("@virtualstate/navigation/transition/known"),ye=Symbol.for("@virtualstate/navigation/transition/promises"),A=Symbol.for("@virtualstate/navigation/intercept"),gt=Symbol.for("@virtualstate/navigation/transition/isOngoing"),te=Symbol.for("@virtualstate/navigation/transition/isPending"),At=Symbol.for("@virtualstate/navigation/transition/isAsync"),pt=Symbol.for("@virtualstate/navigation/transition/wait"),ee=Symbol.for("@virtualstate/navigation/transition/promise/resolved"),tt=Symbol.for("@virtualstate/navigation/transition/rejected"),jt=Symbol.for("@virtualstate/navigation/transition/commit"),z=Symbol.for("@virtualstate/navigation/transition/finish"),$e=Symbol.for("@virtualstate/navigation/transition/start"),We=Symbol.for("@virtualstate/navigation/transition/start/deadline"),me=Symbol.for("@virtualstate/navigation/transition/error"),Ke=Symbol.for("@virtualstate/navigation/transition/finally"),B=Symbol.for("@virtualstate/navigation/transition/abort"),Z=Symbol.for("@virtualstate/navigation/transition/intercept/options/commit"),_t=Symbol.for("@virtualstate/navigation/transition/commit/isManual");class qe extends ce{finished;committed;from;navigationType;[At]=!1;[Z];#n;[M]=Yt();[_]=Yt();get[te](){return!!this.#t.size}get[nt](){return this.#n[nt]}get[it](){return this.#n[it]}get[dt](){return this.#n[dt]}get[_t](){return!!(this[Z]?.includes("after-transition")||this[Z]?.includes("manual"))}[Pt];[Ct];[Zt]=!1;[ot]=!1;[Lt]=!1;[gt]=!1;[ut]=new Set;[R];#t=new Set;#i=!1;#e=new ge;get signal(){return this.#e.signal}get[ye](){return this.#t}constructor(t){super(),this[Z]=[],this[M]=t[M]??this[M],this[_]=t[_]??this[_],this.#n=t;const e=this.finished=this[M].promise,i=this.committed=this[_].promise;e.catch(o=>o),i.catch(o=>o),this.from=t.from,this.navigationType=t.navigationType,this[Pt]=t[Pt],this[Ct]=t[Ct];const r=t[ut];if(r)for(const o of r)this[ut].add(o);this[R]=t[R],this.addEventListener(jt,this.#a,{once:!0}),this.addEventListener(z,this.#s,{once:!0}),this.addEventListener(jt,this.#r,{once:!0}),this.addEventListener(z,this.#o,{once:!0}),this.addEventListener(me,this.#c,{once:!0}),this.addEventListener(B,()=>{if(!this[ot])return this[tt](new oe)}),this.addEventListener("*",this[R].dispatchEvent.bind(this[R])),this.addEventListener("*",t[Ut].dispatchEvent.bind(t[Ut]))}rollback=t=>{if(this.#i)throw new I("Rollback invoked multiple times: Please raise an issue at https://github.com/virtualstate/navigation with the use case where you want to use a rollback multiple times, this may have been unexpected behaviour");return this.#i=!0,this.#n.rollback(t)};#r=()=>{this[Zt]=!0};#o=()=>{this[ot]=!0};#s=()=>{this[M].resolve(this[R])};#a=()=>{this.signal.aborted||this[_].resolve(this[R])};#c=t=>this[tt](t.error);[ee]=(...t)=>{for(const e of t)this.#t.delete(e)};[tt]=async t=>{if(this[Lt])return;this[Lt]=!0,this[B]();const e=this[nt];if((typeof e=="string"||e===Y)&&(await this.dispatchEvent({type:"navigateerror",error:t,get message(){return t instanceof Error?t.message:`${t}`}}),e!==Y&&!(Oe(t)||se(t))))try{await this.rollback()?.finished}catch{throw new I("Failed to rollback, please raise an issue at https://github.com/virtualstate/navigation/issues")}this[_].reject(t),this[M].reject(t)};[A]=t=>{const e=this,i=o();if(this[gt]=!0,!i)return;this[At]=!0;const r=i.then(()=>({status:"fulfilled",value:void 0})).catch(async a=>(await this[tt](a),{status:"rejected",reason:a}));this.#t.add(r);function o(){if(!t)return;if(pe(t))return t;if(typeof t=="function")return t();const{handler:a,commit:s}=t;if(s&&typeof s=="string"&&e[Z].push(s),typeof a=="function")return a()}};[pt]=async()=>{if(!this.#t.size)return this[R];try{const t=[...this.#t],i=(await Promise.all(t)).filter(r=>r.status==="rejected");if(i.length)throw i.length===1?i[0].reason:typeof AggregateError<"u"?new AggregateError(i.map(({reason:r})=>r)):new Error;return this[ee](...t),this[te]?this[pt]():this[R]}catch(t){throw await this.#c(t),await Promise.reject(t)}finally{await this[z]()}};[B](){this.#e.signal.aborted||(this.#e.abort(),this.dispatchEvent({type:B,transition:this,entry:this[R]}))}[z]=async()=>{this[ot]||await this.dispatchEvent({type:z,transition:this,entry:this[R],intercept:this[A]})}}function Ge(){try{if(typeof window<"u"&&window.location)return window.location.href}catch{}}function Kt(n){const t=Ge()??"https://html.spec.whatwg.org/";return new URL((n??"").toString(),t)}function Ve(){let n,t,e=!1,i="pending";const r=new Promise((o,a)=>{n=s=>{i="fulfilled",e=!0,o(s)},t=s=>{i="rejected",e=!0,a(s)}});return q(n),q(t),{get settled(){return e},get status(){return i},resolve:n,reject:t,promise:r}}class ve{type;from;navigationType;constructor(t,e){if(this.type=t,!e)throw new TypeError("init required");if(!e.from)throw new TypeError("from required");this.from=e.from,this.navigationType=e.navigationType??void 0}}class ze{type;canIntercept;canTransition;destination;downloadRequest;formData;hashChange;info;signal;userInitiated;navigationType;constructor(t,e){if(this.type=t,!e)throw new TypeError("init required");if(!e.destination)throw new TypeError("destination required");if(!e.signal)throw new TypeError("signal required");this.canIntercept=e.canIntercept??!1,this.canTransition=e.canIntercept??!1,this.destination=e.destination,this.downloadRequest=e.downloadRequest,this.formData=e.formData,this.hashChange=e.hashChange??!1,this.info=e.info,this.signal=e.signal,this.userInitiated=e.userInitiated??!1,this.navigationType=e.navigationType??"push"}commit(){throw new Error("Not implemented")}intercept(t){throw new Error("Not implemented")}preventDefault(){throw new Error("Not implemented")}reportError(t){throw new Error("Not implemented")}scroll(){throw new Error("Not implemented")}transitionWhile(t){return this.intercept(t)}}const we=Symbol.for("@virtualstate/navigation/formData"),Ee=Symbol.for("@virtualstate/navigation/downloadRequest"),Be=Symbol.for("@virtualstate/navigation/canIntercept"),Ft=Symbol.for("@virtualstate/navigation/userInitiated"),Ht=Symbol.for("@virtualstate/navigation/originalEvent");function Je(){}function Ye(n,t){const e=t.index;return e!==-1?e:-1}function Qe(n){const{commit:t,currentIndex:e,options:i,known:r,currentEntry:o,transition:a,transition:{[it]:s,[R]:c,[A]:g},reportError:x}=n;let{transition:{[nt]:u}}=n,l=[...s];const p=new Set(r);let m=-1,v=e;if(u===Y){const{index:b}=i??{index:void 0};if(typeof b!="number")throw new I("Expected index to be provided for rollback");m=b,v=b}else u==="traverse"||u==="reload"?(m=Ye(s,c),v=m):u==="replace"?e===-1?(u="push",m=e+1,v=m):(m=e,v=e):(m=e+1,v=m);if(typeof m!="number"||m===-1)throw new I("Could not resolve next index");if(!c.url)throw console.trace({navigationType:u,entry:c,options:i}),new I("Expected entry url");const N={url:c.url,key:c.key,index:m,sameDocument:c.sameDocument,getState(){return c.getState()}};let E=!1;const d=Kt(o?.url),T=new URL(N.url),k=d.hash,y=T.hash;if(k!==y){const b=new URL(d.toString());b.hash="";const U=new URL(T.toString());U.hash="",E=b.toString()===U.toString()}let P;const{resolve:h,promise:L}=Ve();function w(){q(P,"Expected contextToCommit"),h(t(P))}const C=new ge,f=new ze("navigate",{signal:C.signal,info:void 0,...i,canIntercept:i?.[Be]??!0,formData:i?.[we]??void 0,downloadRequest:i?.[Ee]??void 0,hashChange:E,navigationType:i?.navigationType??(typeof u=="string"?u:"replace"),userInitiated:i?.[Ft]??!1,destination:N}),S=i?.[Ht],j=a[B].bind(a);if(S){const b=S;f.intercept=function(D){return b.preventDefault(),g(D)},f.preventDefault=function(){return b.preventDefault(),j()}}else f.intercept=g,f.preventDefault=j;f.transitionWhile=f.intercept,f.commit=w,x&&(f.reportError=x),f.scroll=Je,S&&(f.originalEvent=S);const Et=new ve("currententrychange",{from:o,navigationType:f.navigationType});let St=[],Q=[],X=[];const Gt=s.map(b=>b.key);if(u===Y){const{entries:b}=i??{entries:void 0};if(!b)throw new I("Expected entries to be provided for rollback");l=b,l.forEach(D=>p.add(D));const U=l.map(D=>D.key);Q=s.filter(D=>!U.includes(D.key)),X=l.filter(D=>!Gt.includes(D.key))}else if(u==="replace"||u==="traverse"||u==="reload"){l[N.index]=c,u!=="traverse"&&St.push(c),u==="replace"&&(l=l.slice(0,N.index+1));const b=l.map(U=>U.key);Q=s.filter(U=>!b.includes(U.key)),Gt.includes(c.id)&&(X=[c])}else if(u==="push"){let b=!1;if(l[N.index]&&(l=l.slice(0,N.index),b=!0),l.push(c),X=[c],b){const U=l.map(D=>D.key);Q=s.filter(D=>!U.includes(D.key))}}p.add(c);let Vt;return(St.length||X.length||Q.length)&&(Vt={updatedEntries:St,addedEntries:X,removedEntries:Q}),P={entries:l,index:v,known:p,entriesChange:Vt},{entries:l,known:p,index:v,currentEntryChange:Et,destination:N,navigate:f,navigationType:u,waitForCommit:L,commit:w,abortController:C}}function H(n){if(typeof CustomEvent<"u"&&typeof n.type=="string"){if(n instanceof CustomEvent)return n;const{type:t,detail:e,...i}=n,r=new CustomEvent(t,{detail:e??i});return Object.assign(r,i),Le(r,n.type),r}return n}const Mt=Symbol.for("@virtualstate/navigation/setOptions"),yt=Symbol.for("@virtualstate/navigation/setEntries"),ne=Symbol.for("@virtualstate/navigation/setCurrentIndex"),$t=Symbol.for("@virtualstate/navigation/setCurrentKey"),V=Symbol.for("@virtualstate/navigation/getState"),Dt=Symbol.for("@virtualstate/navigation/setState"),ie=Symbol.for("@virtualstate/navigation/disposeState");function Xe(n){return n==="reload"||n==="push"||n==="replace"||n==="traverse"}class Se extends ue{#n=0;#t=[];#i=new Set;#e=-1;#r;#o=new WeakSet;#s="";#a=void 0;#c=void 0;get canGoBack(){return!!this.#t[this.#e-1]}get canGoForward(){return!!this.#t[this.#e+1]}get currentEntry(){return this.#e===-1?(this.#a||(this.#a=new Nt({getState:this[V],navigationType:"push",index:-1,sameDocument:!1,url:this.#s.toString()})),this.#a):this.#t[this.#e]}get transition(){const t=this.#r;return t?.signal.aborted?void 0:t}constructor(t={}){super(),this[Mt](t)}[Mt](t){this.#c=t,this.#s=Kt(t?.baseURL),this.#t=[],t.entries&&this[yt](t.entries),t.currentKey?this[$t](t.currentKey):typeof t.currentIndex=="number"&&this[ne](t.currentIndex)}[$t](t){const e=this.#t.findIndex(i=>i.key===t);e!==-1&&(this.#e=e)}[ne](t){t<=-1||t>=this.#t.length||(this.#e=t)}[yt](t){this.#t=t.map(({key:e,url:i,navigationType:r,state:o,sameDocument:a},s)=>new Nt({getState:this[V],navigationType:Xe(r)?r:"push",sameDocument:a??!0,index:s,url:i,key:e,state:o})),this.#e===-1&&this.#t.length&&(this.#e=0)}[V]=t=>this.#c?.getState?.(t)??void 0;[Dt]=t=>this.#c?.setState?.(t);[ie]=t=>this.#c?.disposeState?.(t);back(t){if(!this.canGoBack)throw new I("Cannot go back");const e=this.#t[this.#e-1];return this.#u("traverse",this.#f(e,{...t,navigationType:"traverse"}))}entries(){return[...this.#t]}forward(t){if(!this.canGoForward)throw new I;const e=this.#t[this.#e+1];return this.#u("traverse",this.#f(e,{...t,navigationType:"traverse"}))}goTo(t,e){return this.traverseTo(t,e)}traverseTo(t,e){const i=this.#t.find(r=>r.key===t);if(i)return this.#u("traverse",this.#f(i,{...e,navigationType:"traverse"}));throw new I}#h=t=>{function e(r,o){return r.origin===o.origin}const i=this.currentEntry?.url;return i?e(new URL(i),new URL(t)):!0};navigate(t,e){let i=this.#s;this.currentEntry?.url&&(i=this.currentEntry?.url);const r=new URL(t,i).toString();let o="push";(e?.history==="push"||e?.history==="replace")&&(o=e?.history);const a=this.#l({getState:this[V],url:r,...e,sameDocument:this.#h(r),navigationType:o});return this.#u(o,a,void 0,e)}#f=(t,e)=>this.#l({...t,getState:this[V],index:t?.index??void 0,state:e?.state??t?.getState(),navigationType:t?.[Rt]??(typeof e?.navigationType=="string"?e.navigationType:"replace"),...e,get[ht](){return t?.[ht]},get[$](){return t?.[$]}});#l=t=>{const e=new Nt({...t,index:t.index??(()=>this.#t.indexOf(e))});return e};#u=(t,e,i,r)=>{if(e===this.currentEntry)throw new I;if(this.#t.findIndex(a=>a.id===e.id)>-1)throw new I;return this.#d(t,e,i,r)};#d=(t,e,i,r)=>{const o=i??new qe({from:e,navigationType:typeof t=="string"?t:"replace",rollback:g=>this.#y(o,g),[nt]:t,[it]:[...this.#t],[dt]:this.#e,[ut]:[...this.#i],[R]:e,[Ut]:this}),{finished:a,committed:s}=o,c=()=>this.#p(t,e,o,r);return this.#g(o),c().catch(g=>{}),{committed:s,finished:a}};#g=t=>{this.#o.add(t)};#p=(t,e,i,r)=>{try{return this.#n+=1,this.#m(t,e,i,r)}finally{this.#n-=1}};#y=(t,e)=>{const i=t[it],r=t[dt],o=i[r],a=o?this.#f(o,e):void 0,s={...e,index:r,known:new Set([...this.#i,...i]),navigationType:a?.[Rt]??"replace",entries:i},c=a?Y:Xt,g=a??this.#l({getState:this[V],navigationType:"replace",index:s.index,sameDocument:!0,...e});return this.#u(c,g,void 0,s)};#m=(t,e,i,r)=>{let o=t;const a=Ze();a&&e.sameDocument&&typeof o=="string"&&a?.mark?.(`same-document-navigation:${e.id}`);let s=!1,c=!1;const{currentEntry:g}=this;this.#r?.finished?.catch(d=>d),this.#r?.[M]?.promise?.catch(d=>d),this.#r?.[_]?.promise?.catch(d=>d),this.#r?.[B](),this.#r=i;const x=i.dispatchEvent({type:$e,transition:i,entry:e}),u=({entries:d,index:T,known:k})=>{i.signal.aborted||(this.#t=d,k&&(this.#i=new Set([...this.#i,...k])),this.#e=T,this[Dt](this.currentEntry))},l=async d=>{if(c)return;c=!0,u(d);const{entriesChange:T}=d,k=[i.dispatchEvent(H({type:jt,transition:i,entry:e}))];T&&k.push(this.dispatchEvent(H({type:"entrieschange",...T}))),await Promise.all(k)},p=async()=>{if(await x,!(typeof r?.index=="number"&&r.entries))throw new I;const d=this.entries(),T=d.map(h=>h.key),k=r.entries.map(h=>h.key),y=d.filter(h=>!k.includes(h.key)),P=r.entries.filter(h=>!T.includes(h.key));return await l({entries:r.entries,index:r.index,known:r.known,entriesChange:y.length||P.length?{removedEntries:y,addedEntries:P,updatedEntries:[]}:void 0}),await this.dispatchEvent(H({type:"currententrychange"})),s=!0,e},m=()=>{if(t===Xt)return p();const d=Qe({currentEntry:g,currentIndex:this.#e,options:r,transition:i,known:this.#i,commit:l,reportError:i[tt]}),T=new Promise(queueMicrotask);let k=[];const y=N(d)[Symbol.iterator](),P={[Symbol.iterator]:()=>({next:()=>y.next()})};async function h(){for(const w of P){if(pe(w)&&k.push(Promise.allSettled([w]).then(([C])=>C)),i[_t]||s&&i[At])return L().then(h);if(i.signal.aborted)break}if(k.length)return L()}async function L(){const w=[...k];if(w.length){k=[];const f=(await Promise.all(w)).filter(Me);if(f.length===1)throw await Promise.reject(f[0]);if(f.length)throw new AggregateError(f,f[0].reason?.message)}else i[gt]||await T}return h().then(()=>i[gt]?void 0:T).then(()=>e)},v=async()=>this.#v();function*N(d){const T=new Promise(queueMicrotask),{currentEntryChange:k,navigate:y,waitForCommit:P,commit:h,abortController:L}=d,w=L.abort.bind(L);if(i.signal.addEventListener("abort",w,{once:!0}),typeof o=="string"||o===Y){const C=g?.dispatchEvent(H({type:"navigatefrom",intercept:i[A],transitionWhile:i[A]}));C&&(yield C)}typeof o=="string"&&(yield i.dispatchEvent(y)),i[_t]||h(),yield P,e.sameDocument&&(yield i.dispatchEvent(k)),s=!0,typeof o=="string"&&(yield e.dispatchEvent(H({type:"navigateto",intercept:i[A],transitionWhile:i[A]}))),yield v(),i[ye].size||(yield T),yield i.dispatchEvent({type:We,transition:i,entry:e}),yield i[pt](),i.signal.removeEventListener("abort",w),yield i[z](),typeof o=="string"&&(yield i.dispatchEvent(H({type:"finish",intercept:i[A],transitionWhile:i[A]})),yield i.dispatchEvent(H({type:"navigatesuccess",intercept:i[A],transitionWhile:i[A]})))}const E=()=>{try{return m()}catch(d){return Promise.reject(d)}};return Promise.allSettled([E()]).then(async([d])=>{d.status==="rejected"&&await i.dispatchEvent({type:me,error:d.reason,transition:i,entry:e}),await v(),await i.dispatchEvent({type:Ke,transition:i,entry:e}),await i[pt](),this.#r===i&&(this.#r=void 0),e.sameDocument&&typeof o=="string"&&(a.mark(`same-document-navigation-finish:${e.id}`),a.measure(`same-document-navigation:${e.url}`,`same-document-navigation:${e.id}`,`same-document-navigation-finish:${e.id}`))}).then(()=>e)};#v=async()=>{for(const t of this.#i){if(this.#t.findIndex(r=>r.key===t.key)!==-1)continue;this.#i.delete(t);const i=H({type:"dispose",entry:t});this[ie](t),await t.dispatchEvent(i),await this.dispatchEvent(i)}};reload(t){const{currentEntry:e}=this;if(!e)throw new I;const i=this.#f(e,t);return this.#u("reload",i,void 0,t)}updateCurrentEntry(t){const{currentEntry:e}=this;if(!e)throw new I("Expected current entry");e[le](t.state),this[Dt](e);const i=new ve("currententrychange",{from:e,navigationType:void 0}),r=H({type:"entrieschange",addedEntries:[],removedEntries:[],updatedEntries:[e]});return Promise.all([this.dispatchEvent(i),this.dispatchEvent(r)])}}function Ze(){return typeof performance<"u"?performance:{now(){return Date.now()},mark(){},measure(){}}}const tn=Symbol.for("@virtualstate/navigation/location/checkChange"),Wt=Symbol.for("@virtualstate/navigation/location/awaitFinished"),et=Symbol.for("@virtualstate/navigation/location/transitionURL"),O=Symbol.for("@virtualstate/navigation/location/url"),en="https://html.spec.whatwg.org/";class nn{#n;#t;constructor(t){this.#n=t,this.#t=t.navigation;const e=()=>{this.#e=void 0,this.#r=void 0};this.#t.addEventListener("navigate",()=>{const i=this.#t.transition;i&&r(i)&&i[_].promise.then(e,e);function r(o){return _ in o}}),this.#t.addEventListener("currententrychange",e)}#i=new WeakMap;#e;#r;get[O](){if(this.#e)return this.#e;const{currentEntry:t}=this.#t;if(!t)return this.#r=Kt(this.#n.baseURL),this.#r;const e=this.#i.get(t);if(e)return e;const i=new URL(t.url??en);return this.#i.set(t,i),i}get hash(){return this[O].hash}set hash(t){this.#o("hash",t)}get host(){return this[O].host}set host(t){this.#o("host",t)}get hostname(){return this[O].hostname}set hostname(t){this.#o("hostname",t)}get href(){return this[O].href}set href(t){this.#o("href",t)}get origin(){return this[O].origin}get pathname(){return this[O].pathname}set pathname(t){this.#o("pathname",t)}get port(){return this[O].port}set port(t){this.#o("port",t)}get protocol(){return this[O].protocol}set protocol(t){this.#o("protocol",t)}get search(){return this[O].search}set search(t){this.#o("search",t)}#o=(t,e)=>{const i=this[O].toString();let r;t==="href"?r=new URL(e,i):(r=new URL(i),r[t]=e);const o=r.toString();i!==o&&this.#s(r,()=>this.#t.navigate(o))};replace(t){return this.#s(t,e=>this.#t.navigate(e.toString(),{history:"replace"}))}reload(){return this.#a(this.#t.reload())}assign(t){return this.#s(t,e=>this.#t.navigate(e.toString()))}[et](t,e){return this.#s(t,e)}#s=async(t,e)=>{const i=this.#e=typeof t=="string"?new URL(t,this[O].toString()):t;try{await this.#a(e(i))}finally{this.#e===i&&(this.#e=void 0)}};[Wt](t){return this.#a(t)}#a=async t=>{if(this.#r=void 0,!t)return;const{committed:e,finished:i}=t;await Promise.all([e||Promise.resolve(void 0),i||Promise.resolve(void 0)])};#c=()=>{const t=this[O],e=t.toString(),i=this.#t.currentEntry?.url;if(e!==i)return this.#s(t,()=>this.#t.navigate(e))};[tn](){return this.#c()}}const rn=Symbol.for("@virtualstate/navigation/history/state");class mt extends nn{#n;#t;constructor(t){super(t),this.#n=t,this.#t=t.navigation}get length(){return this.#t.entries().length}scrollRestoration="manual";get state(){const t=this.#t.currentEntry?.getState();return typeof t=="string"||typeof t=="number"||typeof t=="boolean"?t:this.#n[rn]??void 0}back(){const t=this.#t.entries(),e=this.#t.currentEntry?.index??-1,r=t[e-1]?.url;if(!r)throw new I("Cannot go back");return this[et](r,()=>this.#t.back())}forward(){const t=this.#t.entries(),e=this.#t.currentEntry?.index??-1,r=t[e+1]?.url;if(!r)throw new I("Cannot go forward");return this[et](r,()=>this.#t.forward())}go(t){if(typeof t!="number"||t===0||isNaN(t))return this[Wt](this.#t.reload());const e=this.#t.entries(),{currentEntry:i}=this.#t;if(!i)throw new Error(`Could not go ${t}`);const r=i.index+t,o=e[r];if(!o)throw new Error(`Could not go ${t}`);const a=o.key;return this[Wt](this.#t.traverseTo(a))}replaceState(t,e,i){return i?this[et](i,r=>this.#t.navigate(r.toString(),{state:t,history:"replace"})):this.#t.updateCurrentEntry({state:t})}pushState(t,e,i){return i?this[et](i,r=>this.#t.navigate(r.toString(),{state:t})):this.#t.updateCurrentEntry({state:t})}}class Tn extends mt{}async function kn(n){let t,e;for(;n.transition&&t!==n.transition;)t=n.transition,e=t.finished,await e.catch(i=>{});return e}const on=await sn().catch(an),be=()=>on;async function sn(){const{stringify:n,parse:t}=await st(()=>import("./json-RdnQ9oUJ.js"),__vite__mapDeps([]));return{stringify:n,parse:t}}function an(){const n=JSON.stringify.bind(JSON),t=JSON.parse.bind(JSON);return{stringify:n,parse:t}}function cn(n){return be().stringify(n)}function un(n){return be().parse(n)}const vt=typeof window>"u"?void 0:window,re=typeof self>"u"?void 0:self,W="__@virtualstate/navigation/key",qt="__@virtualstate/navigation/meta";function fn(n=vt){if(!(typeof n>"u"))return n.history}function Te(n){return K(n)&&n[qt]===!0}function J(n){return K(n)&&Te(n[W])}function ln(n,t){t&&(typeof sessionStorage>"u"||sessionStorage.removeItem(n.key))}function hn(n,t=G.limit){let e=n.entries();return typeof t=="number"&&(e=e.slice(-t)),e.map(({id:i,key:r,url:o,sameDocument:a})=>({id:i,key:r,url:o,sameDocument:a}))}function dn(n,t,e=G.limit){return{[qt]:!0,currentIndex:t.index,key:t.key,entries:hn(n,e),state:t.getState()}}function ft(n,t,e=G.limit){return{[W]:dn(n,t,e)}}function gn(n,t,e,i,r){a();function o(){return ft(n,e,r)}function a(){if(!(typeof sessionStorage>"u"))try{const s=cn(o());sessionStorage.setItem(e.key,s)}catch{}}}function pn(n,t){return r()??o();function e(){try{return n.state}catch{return}}function i(){const a=n.originalState??e();return K(a)?a:void 0}function r(){const a=i();if(J(a)&&a[W].key===t.key)return a[W].state}function o(){if(!(typeof sessionStorage>"u"))try{const a=sessionStorage.getItem(t.key);if(!a)return;const s=un(a);return J(s)?s[W].state:void 0}catch{return}}}const G=Object.freeze({persist:!0,persistState:!0,history:!0,limit:50,patch:!0,interceptEvents:!0});function xn(n=G){const{navigation:t}=Pe(n);return t}function ke(n){return K(n)&&typeof n[yt]=="function"&&typeof n[$t]=="function"}function yn(n){const t=[{key:lt()}],e=n??new Se({entries:t}),i=new mt({navigation:e});return{navigation:e,history:i,apply(){ke(n)&&!e.entries().length&&n[yt](t)}}}function mn(n,t){function e(r,o){a();function a(){if(!wn(r))return;q(r);const s={history:"auto",[Ft]:!0,[Ee]:o.download,[Ht]:r};n.navigate(o.href,s)}}function i(r,o){a();function a(){if(r.defaultPrevented)return;const s=r.submitter&&"formMethod"in r.submitter&&r.submitter.formMethod?r.submitter.formMethod:o.method;if(s==="dialog")return;const c=r.submitter&&"formAction"in r.submitter&&r.submitter.formAction?r.submitter.formAction:o.action;let g;try{g=new FormData(o)}catch{g=new FormData(void 0)}const x=s==="get"?new URLSearchParams([...g].map(([v,N])=>N instanceof File?[v,N.name]:[v,N])):void 0,u=s==="post"?g:void 0,l=new URL(c,n.currentEntry.url);x&&(l.search=x.toString());const p=r;q(p);const m={history:"auto",[Ft]:!0,[we]:u,[Ht]:p};n.navigate(l.href,m)}}t.addEventListener("click",r=>{if(r.target?.ownerDocument===t.document){const o=xe(r);K(o)&&e(r,o)}}),t.addEventListener("submit",r=>{if(r.target?.ownerDocument===t.document){const o=Ie(r);K(o)&&i(r,o)}})}function xe(n){return Ce(Ne(n),"a[href]:not([data-navigation-ignore])")}function Ie(n){return Ce(Ne(n),"form:not([data-navigation-ignore])")}function Ne(n){return n.composedPath?n.composedPath()[0]??n.target:n.target}function vn(n,t,e){r(),a(),o();function i(s){try{Object.defineProperty(s,"navigation",{value:e})}catch{}if(!s.history)try{Object.defineProperty(s,"history",{value:t})}catch{}}function r(){if(i(n),n===vt){if(re)try{Object.defineProperty(re,"navigation",{value:e})}catch{}if(typeof globalThis<"u")try{Object.defineProperty(globalThis,"navigation",{value:e})}catch{}}}function o(){if(t instanceof mt)return;const s=new mt({navigation:e}),c=s.pushState.bind(s),g=s.replaceState.bind(s),x=s.go.bind(s),u=s.back.bind(s),l=s.forward.bind(s),p=Object.getPrototypeOf(t),m={pushState:{...Object.getOwnPropertyDescriptor(p,"pushState"),value:c},replaceState:{...Object.getOwnPropertyDescriptor(p,"replaceState"),value:g},go:{...Object.getOwnPropertyDescriptor(p,"go"),value:x},back:{...Object.getOwnPropertyDescriptor(p,"back"),value:u},forward:{...Object.getOwnPropertyDescriptor(p,"forward"),value:l}};Object.defineProperties(p,m);const v=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t),"state");Object.defineProperty(t,"state",{...v,get(){return s.state}}),Object.defineProperty(t,"originalState",{...v})}function a(){if(!n.PopStateEvent)return;const s=n.PopStateEvent.prototype;if(!s)return;const c=Object.getOwnPropertyDescriptor(s,"state");Object.defineProperty(s,"state",{...c,get(){const g=c.get.call(this);return J(g)?g[W].state:g}}),Object.defineProperty(s,"originalState",{...c})}}function Pe(n=G){const{persist:t,persistState:e,history:i,limit:r,patch:o,interceptEvents:a,window:s=vt,navigation:c}={...G,...n},g=t||e,x=s??vt,u=n.history&&typeof n.history!="boolean"?n.history:fn(x);if(!u)return yn();q(x,"window required when using polyfill with history, this shouldn't be seen");const l=u?.state;let p={[qt]:!0,currentIndex:-1,entries:[],key:"",state:void 0};J(l)&&(p=l[W]);let m=p.entries;const v=!!((s||i)&&u);if(!m.length){let y;x.location?.href&&(y=x.location.href);let P;!J(l)&&!Te(l)&&(P=l);const h=lt();m=[{key:h,state:P,url:y}],p.key=h,p.currentIndex=0}const N={entries:m,currentIndex:p?.currentIndex,currentKey:p?.key,getState(y){if(v)return pn(u,y)},setState(y){v&&y.sameDocument&&gn(E,u,y,g,r)},disposeState(y){v&&ln(y,g)}},E=c??new Se(N),d=u?.pushState.bind(u),T=u?.replaceState.bind(u),k=u?.go.bind(u);return{navigation:E,history:u,apply(){if(ke(E)&&E[Mt](N),v){const y=new Set,P=new Set;E.addEventListener("navigate",h=>{if(h.destination.sameDocument)return;h.intercept({commit:"after-transition",async handler(){queueMicrotask(()=>{h.signal.aborted||L()})}});function L(){if(K(h.originalEvent)){const f=xe(h.originalEvent);if(f)return w(f);{const S=Ie(h.originalEvent);if(S)return C(S)}}location.href=h.destination.url}function w(f){const S=f.cloneNode();S.setAttribute("data-navigation-ignore","1"),S.click()}function C(f){const S=f.cloneNode();S.setAttribute("data-navigation-ignore","1"),S.submit()}}),E.addEventListener("currententrychange",({navigationType:h,from:L})=>{const{currentEntry:w}=E;if(!w)return;const{key:C,url:f}=w;if(P.delete(C)||!w?.sameDocument)return;const S=ft(E,w,r);switch(h||"replace"){case"push":return d(S,"",f);case"replace":return T(S,"",f);case"traverse":const j=w.index-L.index;return y.add(C),k(j)}}),x.addEventListener("popstate",h=>{const{state:L,originalState:w}=h,C=w??L;if(!J(C))return;const{[W]:{key:f}}=C;if(y.delete(f))return;P.add(f);let S;try{S=E.traverseTo(f).committed}catch(j){if(j instanceof I&&!t)return;throw j}(t||e)&&S.then(j=>{const Et=ft(E,j,r);T(Et,"",j.url)}).catch(()=>{})})}if(a&&mn(E,x),o&&vn(x,u,E),!u.state){const y=ft(E,E.currentEntry,r);T(y,"",E.currentEntry.url)}}}}function wn(n){return n.button===0&&!n.defaultPrevented&&!n.metaKey&&!n.altKey&&!n.ctrlKey&&!n.shiftKey}function Ce(n,t){let e=i();for(;e;){if(e.matches(t))return q(e),e;e=e.parentElement??e.getRootNode()?.host}return;function i(){if(n)return n.matches instanceof Function?n:n.parentElement}}if(typeof window<"u"&&window.navigation){const n=window.navigation;En(n)}function En(n){if(!n)throw new Error("Expected Navigation")}function In(n=G){const{apply:t,navigation:e}=Pe(n);return t(),e}export{Wt as AppLocationAwaitFinished,tn as AppLocationCheckChange,et as AppLocationTransitionURL,O as AppLocationUrl,ce as EventTarget,en as NAVIGATION_LOCATION_DEFAULT_URL,Se as Navigation,Be as NavigationCanIntercept,ve as NavigationCurrentEntryChangeEvent,ie as NavigationDisposeState,we as NavigationFormData,V as NavigationGetState,mt as NavigationHistory,nn as NavigationLocation,ne as NavigationSetCurrentIndex,$t as NavigationSetCurrentKey,yt as NavigationSetEntries,Mt as NavigationSetOptions,Dt as NavigationSetState,Tn as NavigationSync,Ke as NavigationTransitionFinally,Ft as NavigationUserInitiated,In as applyPolyfill,Pe as getCompletePolyfill,xn as getPolyfill,bn as isInterceptEvent,Xe as isNavigationNavigationType,kn as transition};
function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = []
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}