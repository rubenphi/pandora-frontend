"use strict";(self["webpackChunkpandora"]=self["webpackChunkpandora"]||[]).push([[990],{8990:function(e,t,n){n.r(t),n.d(t,{createSwipeBackGesture:function(){return o}});var r=n(6587),a=n(6453);
/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
const o=(e,t,n,o,s)=>{const c=e.ownerDocument.defaultView,i=e=>e.startX<=50&&t(),u=e=>{const t=e.deltaX,n=t/c.innerWidth;o(n)},d=e=>{const t=e.deltaX,n=c.innerWidth,a=t/n,o=e.velocityX,i=n/2,u=o>=0&&(o>.2||e.deltaX>i),d=u?1-a:a,l=d*n;let h=0;if(l>5){const e=l/Math.abs(o);h=Math.min(e,540)}s(u,a<=0?.01:(0,r.d)(0,a,.9999),h)};return(0,a.createGesture)({el:e,gestureName:"goback-swipe",gesturePriority:40,threshold:10,canStart:i,onStart:n,onMove:u,onEnd:d})}}}]);
//# sourceMappingURL=990.a542152a.js.map