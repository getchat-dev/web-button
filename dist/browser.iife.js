(function(){"use strict";try{if(typeof document<"u"){var t=document.createElement("style");t.appendChild(document.createTextNode(".vt0z5W_button{opacity:1;border:0;border-radius:50%;width:100%;max-width:60px;height:100%;max-height:60px;transition:opacity .6s,transform .6s;display:block;position:fixed;bottom:10px;right:10px;transform:scale(1);box-shadow:0 1px 6px #0000000f,0 2px 32px #00000029}.vt0z5W_button-animation-preclose{opacity:1;transition:opacity .3s,transform .3s;transform:scale(1)}.vt0z5W_button-animation-close{opacity:0;transform:scale(.5)}.vt0z5W_button-animation-preopen{opacity:0;transition:opacity .3s,transform .3s;transform:scale(.5);display:block!important}.vt0z5W_button-animation-open{opacity:1;transform:scale(1)}.vt0z5W_chat{border:1px solid #e6e6e6;width:100%;max-width:370px;height:350px}@media (max-width:460px){.vt0z5W_chat{border:0;border-top:1px solid #e6e6e6;height:auto;position:fixed;top:0;bottom:0;left:0;right:0;max-width:none!important;max-height:none!important}}.vt0z5W_chat+.vt0z5W_button{margin-top:20px}.vt0z5W_chat-animation-preopen{opacity:0;transition:opacity .3s,transform .3s;transform:scale(.95);display:block!important}.vt0z5W_chat-animation-open{opacity:1;transform:scale(1)}.vt0z5W_chat-animation-preclose{opacity:1;transition:opacity .3s,transform .3s;transform:scale(1)}.vt0z5W_chat-animation-close{opacity:0;transform:scale(.95)}")),document.head.appendChild(t)}}catch(o){console.error("vite-plugin-css-injected-by-js",o)}})();
var It=Object.defineProperty;var Ct=l=>{throw TypeError(l)};var Ht=(l,c,u)=>c in l?It(l,c,{enumerable:!0,configurable:!0,writable:!0,value:u}):l[c]=u;var lt=(l,c,u)=>Ht(l,typeof c!="symbol"?c+"":c,u),Ot=(l,c,u)=>c.has(l)||Ct("Cannot "+u);var o=(l,c,u)=>(Ot(l,c,"read from private field"),u?u.call(l):c.get(l)),d=(l,c,u)=>c.has(l)?Ct("Cannot add the same private member more than once"):c instanceof WeakSet?c.add(l):c.set(l,u),a=(l,c,u,Q)=>(Ot(l,c,"write to private field"),Q?Q.call(l,u):c.set(l,u),u);(function(){"use strict";var p,z,y,J,F,m,j,E,W,B,_,G,R,V,x,$,q,U;const l=function(){return"xxxxxxxx-xxxx".replace(/[xy]/g,function(t){var e=Math.random()*16|0,n=t==="x"?e:e&3|8;return n.toString(16)})},c=function(t,e){if(!(t instanceof Node))throw new Error("first argument have to be a DOM Node");if(e!=null){if(typeof e=="string"&&(e=e.trim().replace(/\s{2,}/," ").split(" ")),Object.prototype.toString.apply(e)!=="[object Array]")throw new Error("classNames arg must be string or array, "+Object.prototype.toString.apply(e)+" given");if(e.length)for(let n=0,i=e.length;n<i;n++)t.className.indexOf(e[n])<0&&(t.className=(t.className+" "+e[n]).trim())}},u=function(t,e){if(!t instanceof Node)throw new Error("el arg must be DOM Node");if(e!=null){if(typeof e=="string"&&(e=e.trim().replace(/\s{2,}/," ").split(" ")),Object.prototype.toString.apply(e)!=="[object Array]")throw new Error("classNames arg must be string or array");if(e.length)for(let n=0,i=e.length;n<i;n++)for(;t.className.indexOf(e[n])>-1;)t.className=t.className.replace(e[n],"").trim()}},Q=function(t,e=!1){if(typeof t!="string"){if(e)throw new Error("str argument must be a string, "+typeof t+" given");return null}try{return JSON.parse(t)}catch(n){if(e)throw n}return null},it=function(t){if(typeof t!="string")return t;var e=document.createElement("div");return e.innerHTML=t,e.firstChild.nodeValue},ft=function(t,e=!1){switch(typeof t){case"boolean":return t;case"string":return["true","yes","on","1"].indexOf(t.toLowerCase())>-1;case"number":return t===1}return e},ut=function(t){return parseInt(t,10)},Et=function(t,e=null){return/^#[0-9A-F]{6}$/i.test(t)||/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(\d(?:\.\d+)?))?\)$/i.test(t)?t:e},At=function(t,e=null){if(typeof t=="string"&&t.length===0)try{return URL.parse(t),t}catch{return e}return e},dt=function(t,e){return e==null?null:t(e)},ht=function(t,e=null){if(typeof t=="string"&&t.length>0){let n=t.match(/^((\d+)(\.(\d)+)?)(.*)$/);return n?{value:parseFloat(n[1]),integer:parseInt(n[2],10),fraction:parseInt(n[4],10),unit:n[5]}:t}return e},kt=function(t,e){let n=String,i=null;if(arguments.length>2){const s={string:String,decimal:ut,number:Number,boolean:ft,bool:ft,color:Et,url:At};if(!s.hasOwnProperty(arguments[2]))throw new Error("3rd arg must be one of the following types: "+Object.keys(s).join(", "));n=s[arguments[2]],i=arguments[3]}else arguments.length===3&&(i=arguments[2]);if(t instanceof Element){if("getAttribute"in t)return dt(n,it(t.getAttribute(e)))??i;{let s=Array.prototype.slice.call(t.attributes);for(let r=0,f=s.length;r<f;r++)if(s[r].nodeName===e)return dt(n,it(s[r].nodeValue))??i}}return null},ot=function(t){return Object.prototype.toString.apply(t)==="[object Object]"},pt=function(t){return typeof t=="string"&&t.length?t:ot(t)?Object.keys(t).filter(function(e){return t[e]!==!1}).join(" "):Array.isArray(t)?t.join(" "):null},bt=function(){var t={transition:"transitionend",OTransition:"oTransitionEnd",MozTransition:"transitionend",WebkitTransition:"webkitTransitionEnd"},e=document.createElement("div");for(var n in t)if(e.style[n]!==void 0)return t[n];return null}(),rt=function(t,e,n=null){let i={rpcId:l(),type:e};if(n){if(typeof n=="string"&&(n=Q(n)),typeof n!="object")throw new Error("data argument must be an object, "+typeof n+" given");i=Object.assign({},n,i)}return t instanceof HTMLIFrameElement?(t.contentWindow.postMessage(JSON.stringify(i),"*"),i.rpcId):null},jt=1e3,X=function(t,e,n){return new Promise((i,s)=>{const r=t.style.display==="none"?"block":"none";let f=setTimeout(()=>{i()},jt);const h=function(){clearTimeout(f),t.removeEventListener(bt,h),t.style.display=r,u(t,[e,n]),i()};t.addEventListener(bt,h),c(t,e),setTimeout(function(){c(t,n)},40)})};let O={};window.addEventListener("message",function(t){var e={};if(t.data)if(typeof t.data=="string")try{e=JSON.parse(t.data)}catch{return}else e=t.data;e.type&&Array.isArray(O==null?void 0:O[e.type])&&O[e.type].length&&(O[e.type]=O[e.type].filter(n=>{try{return n(t,e)!==-1}catch(i){return console.error("Error in onMessage handler:",i),!0}}))});const yt=function(t,e){typeof t=="string"&&typeof e=="function"&&(O.hasOwnProperty(t)||(O[t]=[]),O[t].push(e))};function st(...t){let e={};if(t.length===1)typeof t[0]=="object"&&Object.prototype.toString.call(t[0])==="[object Object]"&&(e=t[0]);else if(t.length>1&&typeof t[0]=="string"){e[t[0]]=[];let n=Array.prototype.slice.call(t,1);const i=n[n.length-1]instanceof HTMLIFrameElement?n.pop():null;if(n.length){for(let s=0,r=n.length;s<r;s++)if(typeof n[s]=="function"){if(i){const f=n[s];n[s]=function(h,b){if(i.contentWindow===h.source.window)return f(h,b)}}e[t[0]].push(n[s])}}}if(Object.keys(e).length){for(let n in e)if(typeof e[n]=="function")yt(n,e[n]);else if(typeof e[n]=="object"&&Object.prototype.toString.call(e[n])==="[object Array]")for(let i in e[n])yt(n,e[n][i])}}function xt(t,e,n,i,s){t instanceof Element||(t=document.body);const r=document.createElement("iframe");r.src=e,r.setAttribute("frameborder","0"),r.setAttribute("seamless","seamless"),r.style.width="100%",r.style.height="100%";let f=function(){},h=window.getComputedStyle(t);if(h.display==="none"){const b=h.visibility;f=function(){t.style.display="none",t.style.visibility=b},r.onerror=f,t.style.visibility="hidden",t.style.display="block"}return st("getchat.loaded",function(){return f(),typeof i=="function"&&i(r),-1},r),t.appendChild(r),r}let T=[];const at=function(t){if(t.key==="Escape"){const e=T.pop();T.length===0&&document.removeEventListener("keydown",at),typeof e=="function"&&e()}},gt={bind:function(t){typeof t=="function"&&T.push(t),T.length===1&&document.addEventListener("keydown",at)},unbind:function(t){typeof t=="function"&&(T=T.filter(e=>e!==t)),T.length===0&&document.removeEventListener("keydown",at)}},v={button:"vt0z5W_button","button-animation-close":"vt0z5W_button-animation-close","button-animation-open":"vt0z5W_button-animation-open","button-animation-preclose":"vt0z5W_button-animation-preclose","button-animation-preopen":"vt0z5W_button-animation-preopen",chat:"vt0z5W_chat","chat-animation-close":"vt0z5W_chat-animation-close","chat-animation-open":"vt0z5W_chat-animation-open","chat-animation-preclose":"vt0z5W_chat-animation-preclose","chat-animation-preopen":"vt0z5W_chat-animation-preopen"};class mt{constructor({id:e,url:n,button:i,closeOnEscape:s=!0,autoload:r,autoopen:f=!1,autoopenDelay:h,onBeforeEmbedChat:b,onChatLoaded:w,onBeforeOpen:L,onAfterOpen:tt,onBeforeClose:D,onAfterClose:I}){d(this,p);d(this,z);d(this,y);d(this,J);d(this,F,!0);d(this,m,-1);d(this,j,!1);d(this,E,!1);d(this,W);d(this,B);d(this,_);d(this,G);d(this,R);d(this,V);d(this,x);lt(this,"open",()=>new Promise(async(e,n)=>{if(o(this,m)<1&&await this.load(),o(this,j)&&!o(this,E)){e();return}try{a(this,E,!0),typeof o(this,_)=="function"&&await o(this,_).call(this),o(this,p)&&await X(o(this,p),v["button-animation-preclose"],v["button-animation-close"]),await X(o(this,z),v["chat-animation-preopen"],v["chat-animation-open"]),typeof o(this,G)=="function"&&await o(this,G).call(this),rt(o(this,y),"getchat.messenger.repaint"),a(this,E,!1),a(this,j,!0),rt(o(this,y),"getchat.chat.input.focus"),o(this,F)&&gt.bind(this.close)}catch(i){n(i)}e()}));lt(this,"close",()=>new Promise(async(e,n)=>{if(!o(this,j)&&!o(this,E)){e();return}o(this,F)&&gt.unbind(this.close);try{a(this,E,!0),typeof o(this,R)=="function"&&await o(this,R).call(this),await X(o(this,z),v["chat-animation-preclose"],v["chat-animation-close"]),o(this,p)&&await X(o(this,p),v["button-animation-preopen"],v["button-animation-open"]),a(this,E,!0),a(this,j,!1),typeof o(this,V)=="function"&&await o(this,V).call(this),e()}catch(i){n(i)}}));if(a(this,J,n),a(this,F,s),i instanceof Element&&a(this,p,i),typeof b!="function")throw new Error("onBeforeEmbedChat parameter must be a function, "+typeof b+" given");a(this,W,b);let g;f&&(f!=="once"||!window.localStorage.getItem("getchat_opened"))&&(g=isNaN(h)?this.open:()=>{setTimeout(this.open,h*1e3)}),a(this,B,()=>{a(this,m,1),g&&g(),typeof w=="function"&&w(),a(this,W,null),a(this,B,null)}),r&&this.load(!1),a(this,_,L),a(this,G,tt),a(this,R,D),a(this,V,I),o(this,p)&&o(this,p).addEventListener("click",()=>{this.toggle()});{let Y,et;const C=new Promise((A,S)=>{Y=A,et=S});a(this,x,{promise:C,resolve:Y,reject:et}),o(this,p)&&C.then(async()=>{var S;const A=await this.rpc("getchat.messenger.getUnreads");o(this,p).setBadge(((S=A==null?void 0:A.total)==null?void 0:S.messages)??0)})}}whenReady(){var e;return(e=o(this,x))!=null&&e.promise?o(this,x).promise:o(this,m)===1?Promise.resolve():new Promise}load(e=!0){return new Promise((n,i)=>{var s;try{if(o(this,m)>-1){n();return}a(this,m,0);const r=o(this,W).call(this);if(!(r instanceof Element))throw new Error("onBeforeEmbedChat must return an Element");a(this,z,r),e&&((s=o(this,p))==null||s.setState("loading")),a(this,y,xt(r,o(this,J),{},()=>{var f,h;o(this,B).call(this),(f=o(this,p))==null||f.setState("loaded"),a(this,m,1),n(),(h=o(this,x))==null||h.resolve(),a(this,x,null)}))}catch(r){i(r)}})}toggle(){return new Promise(async(e,n)=>{if(o(this,m)===0){e();return}o(this,j)?await this.close():await this.open(),e()})}addEventListener(e,n){this.whenReady().then(()=>{o(this,y)&&st(e,n,o(this,y))})}getButton(){return o(this,p)}getChatNode(){return o(this,z)}getChatIframeNode(){return o(this,y)}rpc(e,n,i=5e3){return new Promise((s,r)=>{if(o(this,m)<1){r("Chat is not loaded");return}if(!o(this,y)){r("Chat iframe is not loaded");return}let f;const h=(w,L)=>(clearTimeout(f),s(L==null?void 0:L.data),-1),b=rt(o(this,y),e,n);b&&(st("response."+b,h,o(this,y)),i>0&&(f=setTimeout(()=>{r("Timeout")},i)))})}}p=new WeakMap,z=new WeakMap,y=new WeakMap,J=new WeakMap,F=new WeakMap,m=new WeakMap,j=new WeakMap,E=new WeakMap,W=new WeakMap,B=new WeakMap,_=new WeakMap,G=new WeakMap,R=new WeakMap,V=new WeakMap,x=new WeakMap;const wt=function(t,e,n){let i=kt(t,e,n);i&&t.style.setProperty(`--${e.replace("data-","")}`,i)},ct=["bgcolor","color","bdradius","bdwidth","bdcolor","badgebg","badgecolor"];class N extends HTMLElement{constructor(){super();d(this,$);d(this,q,!1);d(this,U);this.attachShadow({mode:"open"})}connectedCallback(){this.render(),ct.forEach(n=>{this.hasAttribute("data-"+n)&&wt(this,"data-"+n,"string")}),a(this,U,new MutationObserver(n=>{for(let i of n)if(i.type==="attributes"){let s=i.attributeName;s.startsWith("data-")&&(s=s.replace("data-","")),ct.includes(s.replace("data-",""))&&wt(this,i.attributeName,"string")}})),o(this,U).observe(this,{attributes:!0})}disconnectedCallback(){o(this,U).disconnect()}setChatInstance(n){!o(this,$)&&n instanceof mt&&a(this,$,n)}getChatInstance(){return o(this,$)}setState(n){n=n.toLowerCase(),n==="loading"?c(this,"loading"):(u(this,"loading"),n==="loaded"&&this.shadowRoot.querySelector(".loader").remove())}setBadge(n){n=ut(n);const i=this.shadowRoot.querySelector(".unreads");i&&(n>0?(i.textContent=n,c(i,"unreads--visible")):u(i,"unreads--visible"))}setStyles(n){const i=this.shadowRoot.getElementById("dynamic-styles");let s="";for(const[r,f]of Object.entries(n))s+=`${r} { ${f} } `;i.textContent=s}render(){o(this,q)||(this.shadowRoot.innerHTML=`
            <style id="dynamic-styles"></style>
            <button class="button">
                <div class="button-icon">
                    <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                        <path fill="inherit"
                            d="M7 14h6a.968.968 0 0 0 .713-.288A.964.964 0 0 0 14 13a.968.968 0 0 0-.288-.713A.964.964 0 0 0 13 12H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 13c0 .283.096.521.288.713.192.192.43.288.712.287Zm0-3h10a.968.968 0 0 0 .713-.288A.964.964 0 0 0 18 10a.968.968 0 0 0-.288-.713A.964.964 0 0 0 17 9H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 10c0 .283.096.521.288.713.192.192.43.288.712.287Zm0-3h10a.968.968 0 0 0 .713-.288A.964.964 0 0 0 18 7a.968.968 0 0 0-.288-.713A.964.964 0 0 0 17 6H7a.968.968 0 0 0-.713.288A.964.964 0 0 0 6 7c0 .283.096.521.288.713.192.192.43.288.712.287ZM6 18l-2.3 2.3c-.317.317-.68.388-1.088.213-.409-.175-.613-.487-.612-.938V4c0-.55.196-1.021.588-1.413A1.922 1.922 0 0 1 4 2h16c.55 0 1.021.196 1.413.588.392.392.588.863.587 1.412v12c0 .55-.196 1.021-.588 1.413A1.922 1.922 0 0 1 20 18H6Zm-.85-2H20V4H4v13.125L5.15 16Z" />
                    </svg>
                </div>
                <div class="unreads"></div>
                <div class="loader"></div>
            </button>
        `,this.setStyles({":host":`
                background: none;
                -webkit-font-smoothing: antialiased;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                cursor: pointer;
            `,":host(.loading)":`
                cursor: wait;
            `,".button":`
                position: relative;
                display: block;
                margin: 0;
                padding: 0;
                width: 100%;
                background: var(--bgcolor, #000);
                border: 0;
                border-radius: var(--bdradius, 50%);
                border-width: var(--bdwidth, 0);
                border-color: var(--bdcolor, currentColor);
                outline: none;
                cursor: inherit;

                -webkit-transition: background .3s ease;
                -moz-transition: background .3s ease;
                -o-transition: background .3s ease;
                transition: background .3s ease;
            `,".button:before":`
                display: block;
                padding-top: 100%;
                content: '';
            `,".button-icon":`
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50%;
                fill-rule: nonzero;
                fill: var(--color, #FFF);
                transition: opacity .3s ease;
            `,".button-icon > svg":`
                width: 100%;
            `,".unreads":`
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(50%, -50%) scale(0.95);
                display: block;
                box-sizing: border-box;
                padding: 0 4px;
                min-width: 16px;
                height: 16px;
                line-height: 16px;
                background: var(--badgebg, #F16843);
                border-radius: 8px;
                color: var(--badgecolor, #FFF);
                opacity: 0;
                transition: opacity .15s ease, transform .15s ease;
            `,".unreads--visible":`
                transform: translate(50%, -50%) scale(1);
                opacity: 1;
            `,".loader":`
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0;
                display: block;
                width: 80%;
                height: 80%;
                border: .2rem solid rgba(255, 255, 255, .7);
                border-top-color: currentColor;
                border-radius: 50%;
                animation: spin 1s infinite;
                transition: opacity .3s ease;
            `,":host(.loading) .button-icon":`
                opacity: 0;
            `,":host(.loading) .loader":`
                opacity: 1;
            `,"@keyframes spin":`
                0% {
                    transform: translate(-50%, -50%) rotate(0deg);
                }
                100% {
                    transform: translate(-50%, -50%) rotate(360deg);
                }
            `}),a(this,q,!0))}}$=new WeakMap,q=new WeakMap,U=new WeakMap,N.supportedAttributes=ct,customElements.define("getchat-button",N);async function Lt({uri:t,className:e,showUnread:n=!1,autoload:i=!1,autoopen:s=!1,autoopenDelay:r=5,closeOnEscape:f,color:h,mobileModeMaxWidth:b=460,insertButtonTo:w,buttonStyle:L,chatClassName:tt,chatParent:D,chatStyle:I,chatNode:g,...Y}){var vt;const et="GetChat".toLowerCase()+l();if(typeof w=="function"&&(w=w()),w instanceof Element){if(!document.body.contains(w))throw new Error("insertButtonTo is Element but not yet in DOM, please insert it first")}else w=document.body;const C=document.createElement("getchat-button");if(C.id=et,e||(e=v.button),e=pt(e),e&&c(C,e),ot(L)&&Object.assign(C.style,L),(vt=N.supportedAttributes)!=null&&vt.length)for(let H of N.supportedAttributes)Y[H]&&C.setAttribute("data-"+H,Y[H]);w.appendChild(C);let A,S,nt=!1;const K=new mt({url:it(t),button:C,autoload:i,autoopen:s,autoopenDelay:r,closeOnEscape:f,onBeforeEmbedChat:function(){let M=!0;return g instanceof Element||(g=document.createElement("div"),M=!1),g.className=v.chat,ot(I)?I=Object.assign({},I,{display:"none"}):I={display:"none"},Object.assign(g.style,I),tt&&c(g,pt(tt)),(!M||!document.body.contains(g))&&(D instanceof Element||(D=document.body),D.appendChild(g)),g},onChatLoaded:function(){window.localStorage.setItem("getchat_opened","1");const H=window.innerHeight,M=K.getChatNode();if(M){let{display:St,visibility:Tt,position:zt,top:P,right:Ft,bottom:k,left:Wt}=getComputedStyle(M);const Z={display:St,visibility:Tt};Object.assign(M.style,{display:"block",visibility:"hidden"}),requestAnimationFrame(()=>{zt==="fixed"?(k=ht(k,"auto"),P=ht(P,"auto"),k!=="auto"&&(k!=null&&k.value)?P==="auto"&&(Z.top=k.value+k.unit,Z.height="auto"):P!=="auto"&&P.value&&k==="auto"&&(Z.bottom=P.value+P.unit,Z.height="auto")):Z.height=`${Math.min(H-20,500)}px`,Object.assign(M.style,Z)})}},onBeforeOpen:function(){console.info("onBeforeOpen",window.innerWidth,b),window.innerWidth<=b&&(console.info("onBeforeOpen1",window.clientWidth,b),A=window.scrollY||window.pageYOffset,S=getComputedStyle(document.body).position,nt=!0)},onAfterOpen:function(){nt&&(window.scrollTo({top:0,left:0,behavior:"instant"}),document.body.style.position="fixed")},onBeforeClose:function(){nt&&(S&&(document.body.style.position=S),A&&window.scrollTo({top:A,left:0,behavior:"instant"})),nt=!1}});return C.setChatInstance(K),K.addEventListener("getchat.close",function(H){K.close()}),K}(function(t){var n;if((n=t.GetChat)!=null&&n.isLoaded)return;t.GetChat={version:"0.1.3",createButton:Lt};const e="GetChat".toLowerCase()+"onloaded";typeof t[e]=="function"&&t[e](t.GetChat),t.GetChat.isLoaded=!0,Object.freeze&&Object.freeze(t.GetChat)})(window)})();
