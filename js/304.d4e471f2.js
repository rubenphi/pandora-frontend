"use strict";(self["webpackChunkpandora"]=self["webpackChunkpandora"]||[]).push([[304],{304:function(n,t,e){e.r(t),e.d(t,{default:function(){return k}});var o=e(6252),a=e(3577);const l=(0,o.Uk)("GANADOR");function u(n,t,e,u,i,r){const s=(0,o.up)("ion-title"),d=(0,o.up)("ion-icon"),c=(0,o.up)("ion-button"),w=(0,o.up)("ion-buttons"),p=(0,o.up)("ion-toolbar"),g=(0,o.up)("ion-header"),f=(0,o.up)("ion-label"),m=(0,o.up)("ion-text"),k=(0,o.up)("ion-note"),_=(0,o.up)("ion-item"),h=(0,o.up)("ion-list"),O=(0,o.up)("ion-content"),y=(0,o.up)("ion-page");return(0,o.wg)(),(0,o.j4)(y,null,{default:(0,o.w5)((()=>[(0,o.Wm)(g,null,{default:(0,o.w5)((()=>[(0,o.Wm)(p,null,{default:(0,o.w5)((()=>[(0,o.Wm)(s,{size:"large",class:"ion-text-center"},{default:(0,o.w5)((()=>[(0,o.Uk)((0,a.zw)(u.cuestionario.tema),1)])),_:1}),(0,o.Wm)(w,{slot:"start",class:"ion-margin-start"},{default:(0,o.w5)((()=>[u.id?((0,o.wg)(),(0,o.j4)(c,{key:0,href:"cuestionario/"+u.id},{default:(0,o.w5)((()=>[(0,o.Wm)(d,{icon:u.arrowBackOutline},null,8,["icon"])])),_:1},8,["href"])):(0,o.kq)("",!0)])),_:1}),(0,o.Wm)(w,{slot:"end",class:"ion-margin-end"},{default:(0,o.w5)((()=>[u.id?((0,o.wg)(),(0,o.j4)(c,{key:0,href:"ganadores/"+u.id},{default:(0,o.w5)((()=>[(0,o.Wm)(d,{icon:u.refreshOutline},null,8,["icon"])])),_:1},8,["href"])):(0,o.kq)("",!0)])),_:1})])),_:1})])),_:1}),(0,o.Wm)(O,{fullscreen:!0},{default:(0,o.w5)((()=>[(0,o.Wm)(h,null,{default:(0,o.w5)((()=>[((0,o.wg)(!0),(0,o.iD)(o.HY,null,(0,o.Ko)(u.respuestas,((n,t)=>((0,o.wg)(),(0,o.j4)(_,{key:t,lines:"full",class:"ion-padding-end"},{default:(0,o.w5)((()=>[0===t?((0,o.wg)(),(0,o.j4)(d,{key:0,icon:u.trophyOutline,size:"large",slot:"start"},null,8,["icon"])):n.total>0?((0,o.wg)(),(0,o.j4)(d,{key:1,icon:u.happyOutline,size:"large",slot:"start"},null,8,["icon"])):((0,o.wg)(),(0,o.j4)(d,{key:2,icon:u.sadOutline,size:"large",slot:"start"},null,8,["icon"])),(0,o.Wm)(f,{color:"medium"},{default:(0,o.w5)((()=>[(0,o.Uk)((0,a.zw)(n.grupo.nombre),1)])),_:2},1024),(0,o.Wm)(k,{slot:"end"},{default:(0,o.w5)((()=>[0===t?((0,o.wg)(),(0,o.j4)(m,{key:0,color:"warning"},{default:(0,o.w5)((()=>[(0,o._)("h6",null,[(0,o.Wm)(d,{icon:u.starOutline},null,8,["icon"]),l,(0,o.Wm)(d,{icon:u.starOutline},null,8,["icon"])])])),_:1})):(0,o.kq)("",!0),n.total>0?((0,o.wg)(),(0,o.j4)(m,{key:1,color:"success"},{default:(0,o.w5)((()=>[(0,o._)("h6",null,"Total Puntos: "+(0,a.zw)(n.total),1)])),_:2},1024)):((0,o.wg)(),(0,o.j4)(m,{key:2,color:"danger"},{default:(0,o.w5)((()=>[(0,o._)("h6",null,"Total Puntos: "+(0,a.zw)(n.total),1)])),_:2},1024)),n.grupo_id===u.usuario.grupo_id||"admin"==u.usuario.rol?((0,o.wg)(),(0,o.j4)(m,{key:3},{default:(0,o.w5)((()=>[(0,o.Uk)("Nota: "+(0,a.zw)(n.nota),1)])),_:2},1024)):(0,o.kq)("",!0)])),_:2},1024)])),_:2},1024)))),128))])),_:1})])),_:1})])),_:1})}var i=e(9669),r=e.n(i),s=e(2262),d=e(6886),c=e(2119),w=e(8903),p=e(1502),g={components:{IonTitle:p.wd,IonHeader:p.Gu,IonToolbar:p.sr,IonContent:p.W2,IonPage:p._i,IonIcon:p.gu,IonButtons:p.Sm,IonButton:p.YG,IonList:p.q_,IonItem:p.Ie,IonNote:p.uN,IonText:p.yW,IonLabel:p.Q$},setup(){const n=(0,d.am)(),t=(0,c.yj)(),{id:e}=t.params,o=(0,s.iH)({tema:""}),a=(0,s.iH)([{grupo:{nombre:"Cargando"},total:"Cargando"}]);return(0,p.Yr)((async()=>{(0,d.rs)(),r().create({headers:{"Access-Control-Allow-Origin":"*"}}),await r().get("/respuestas/resultado/"+e).then((n=>{a.value=n.data.map((t=>(t.nota=(5*t.total/n.data[0].total).toFixed(1),t.nota=t.nota<0?0:t.nota,t)))})),r().create({headers:{"Access-Control-Allow-Origin":"*"}}),await r().get("/cuestionarios/"+e).then((n=>{o.value=n.data}))})),{usuario:n,id:e,cuestionario:o,respuestas:a,arrowBackOutline:w.Pjk,handLeftOutline:w.bB7,paperPlaneOutline:w.I88,refreshOutline:w.D3P,happyOutline:w.TSA,sadOutline:w.YQU,ribbonOutline:w.Muk,starOutline:w.i6c,trophyOutline:w.AmN}}},f=e(3744);const m=(0,f.Z)(g,[["render",u]]);var k=m}}]);
//# sourceMappingURL=304.d4e471f2.js.map