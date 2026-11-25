"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity, ArrowLeft, BarChart3, CircleHelp, Copy,
  GitBranch, Layers3, LayoutGrid, Link2, MoreHorizontal, MousePointer2,
  Pause, Play, Plus, Save, Search, Settings2, Trash2, X, ZoomIn, ZoomOut
} from "lucide-react";
import {
  Campaign, Edge, Kind, Node, Stage, StepState, kindLabels, stageLabels,
  stateLabels, templates
} from "../lib/campaign";

type View = "all" | Stage;
const kinds: Kind[] = ["audience","channel","landing","qualification","sales","measurement","task"];
const states: StepState[] = ["planned","ready","running","blocked","done"];
const stages: Stage[] = ["draft","live","paused","archived"];
const clone = <T,>(value:T):T => JSON.parse(JSON.stringify(value));
const date = (s:string) => s ? new Date(s).toLocaleDateString("hu-HU",{month:"short",day:"numeric"}) : "Nincs dátum";
const storageKey = "flowboard-demo-campaigns-v1";
function seeded():Campaign[] {
  const now=new Date().toISOString();
  const b2b=clone(templates.b2b);
  b2b.nodes[1].state="running";b2b.nodes[1].target="50 lead";b2b.nodes[1].actual="32 lead";
  b2b.nodes[2].state="running";b2b.nodes[2].target="20 kvalifikált";b2b.nodes[2].actual="12 kvalifikált";
  const linkedin=clone(templates.linkedin);
  return [
    {id:"sample-b2b",name:"Minta · B2B leadgenerálás",client:"Bemutató ügyfél",objective:"Döntéshozói beszélgetések szerzése",status:"live",channel:b2b.channel,budget:180000,startDate:"",endDate:"",nodes:b2b.nodes,edges:b2b.edges,createdAt:now,updatedAt:now},
    {id:"sample-linkedin",name:"Minta · LinkedIn kampány",client:"Bemutató ügyfél",objective:"Kapcsolatépítés és marketing kvalifikálás",status:"draft",channel:linkedin.channel,budget:null,startDate:"",endDate:"",nodes:linkedin.nodes,edges:linkedin.edges,createdAt:now,updatedAt:now}
  ];
}
function read():Campaign[] {
  const data=localStorage.getItem(storageKey);
  if(data) return JSON.parse(data) as Campaign[];
  const samples=seeded();localStorage.setItem(storageKey,JSON.stringify(samples));return samples;
}
const request = async (method:string,body?:unknown,id?:string) => {
  const items=read();
  if(method==="GET") return {items,item:items[0]};
  if(method==="DELETE") {
    if(!items.some(c=>c.id===id)) throw new Error("A kampány nem található.");
    localStorage.setItem(storageKey,JSON.stringify(items.filter(c=>c.id!==id)));
    return {items:[],item:items[0]};
  }
  const campaign=body as Campaign;
  if(!campaign.name.trim()) throw new Error("Add meg a kampány nevét.");
  const now=new Date().toISOString();
  const item=method==="POST"
    ? {...campaign,id:crypto.randomUUID(),createdAt:now,updatedAt:now}
    : {...campaign,updatedAt:now};
  if(method==="PUT"&&!items.some(c=>c.id===item.id)) throw new Error("A kampány nem található.");
  const next=method==="POST" ? [item,...items] : items.map(c=>c.id===item.id?item:c);
  localStorage.setItem(storageKey,JSON.stringify(next));
  return {items:next,item};
};

function NewCampaign({onClose,onCreate}:{onClose:()=>void;onCreate:(c:Campaign)=>Promise<void>}) {
  const [template,setTemplate]=useState<keyof typeof templates>("b2b");
  const [name,setName]=useState("");
  const [client,setClient]=useState("");
  const [objective,setObjective]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function create() {
    if(!name.trim()) {setError("Add meg a kampány nevét.");return}
    setBusy(true);setError("");
    const t=templates[template];
    try {
      await onCreate({id:"",name:name.trim(),client:client.trim(),objective:objective.trim(),
        status:"draft",channel:t.channel,budget:null,startDate:"",endDate:"",
        nodes:clone(t.nodes),edges:clone(t.edges),createdAt:"",updatedAt:""});
    } catch(e) {setError((e as Error).message)} finally {setBusy(false)}
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-campaign" onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-header">
        <div><div className="eyebrow">Új terv</div><h2 id="new-campaign">Kampány létrehozása</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Bezárás"><X size={20}/></button>
      </div>
      <p className="muted">Indulj egy bevált folyamatból, vagy rajzold meg a sajátodat.</p>
      <div className="template-grid">
        {Object.entries(templates).map(([key,t])=><button key={key} className={"template-card "+(template===key?"selected":"")} onClick={()=>setTemplate(key as keyof typeof templates)}>
          <span className="template-icon">{key==="blank"?<Plus size={21}/>:<GitBranch size={21}/>}</span>
          <strong>{t.title}</strong><small>{t.nodes.length ? t.nodes.length+" lépés · "+t.channel : "Szabadon építhető"}</small>
        </button>)}
      </div>
      <div className="form-grid">
        <label className="field">Kampány neve <input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="pl. Q1 döntéshozói kampány" maxLength={160}/></label>
        <label className="field">Ügyfél <input value={client} onChange={e=>setClient(e.target.value)} placeholder="pl. Training Hungary" maxLength={160}/></label>
        <label className="field full">Cél <input value={objective} onChange={e=>setObjective(e.target.value)} placeholder="Mi a kampány üzleti célja?"/></label>
      </div>
      {error&&<div className="error-message">{error}</div>}
      <div className="modal-actions"><button className="button secondary" onClick={onClose}>Mégse</button><button className="button primary" disabled={busy} onClick={create}>{busy?"Létrehozás…":"Piszkozat létrehozása"}</button></div>
    </div>
  </div>;
}

function Overview({campaigns,view,setView,open,create,loading,query,setQuery}:{
  campaigns:Campaign[];view:View;setView:(v:View)=>void;open:(c:Campaign)=>void;
  create:()=>void;loading:boolean;query:string;setQuery:(v:string)=>void
}) {
  const running=campaigns.filter(c=>c.status==="live");
  const drafts=campaigns.filter(c=>c.status==="draft");
  const blocked=running.reduce((sum,c)=>sum+c.nodes.filter(n=>n.state==="blocked").length,0);
  const filtered=campaigns.filter(c=>(view==="all" || c.status===view) &&
    (c.name+" "+c.client+" "+c.channel).toLocaleLowerCase("hu-HU").includes(query.toLocaleLowerCase("hu-HU")));
  return <>
    <div className="overview-head"><div><div className="eyebrow">Munkaterület / Kampányok</div><h1>Kampányáttekintés</h1><p>Egy helyen a futó folyamatok és a következő kampányok tervei.</p></div>
      <button className="button primary" onClick={create}><Plus size={18}/> Új kampány</button></div>
    <div className="stats">
      <div className="stat"><div className="stat-top"><span>Éles kampányok</span><span className="stat-icon violet"><Activity size={19}/></span></div><strong>{running.length}</strong><small>Jelenleg futó folyamat</small></div>
      <div className="stat"><div className="stat-top"><span>Piszkozatok</span><span className="stat-icon blue"><Layers3 size={19}/></span></div><strong>{drafts.length}</strong><small>Tervezés alatt</small></div>
      <div className="stat"><div className="stat-top"><span>Elakadt lépések</span><span className="stat-icon amber"><CircleHelp size={19}/></span></div><strong>{blocked}</strong><small>Éles kampányokon belül</small></div>
    </div>
    <div className="section-head"><div><h2>Kampányok</h2><p>Válassz egy kampányt a folyamat megnyitásához.</p></div><div className="search"><Search size={18}/><input aria-label="Kampány keresése" placeholder="Kampány vagy ügyfél keresése" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    <div className="tabs" role="tablist" aria-label="Kampányállapot">
      {(["all","live","draft","paused","archived"] as View[]).map(v=><button key={v} role="tab" aria-selected={view===v} className={view===v?"active":""} onClick={()=>setView(v)}>{v==="all"?"Összes":stageLabels[v]}<span>{v==="all"?campaigns.length:campaigns.filter(c=>c.status===v).length}</span></button>)}
    </div>
    {loading?<div className="empty-state">Kampányok betöltése…</div>:filtered.length===0?
      <div className="empty-state"><div className="empty-graphic"><GitBranch size={30}/></div><h3>{campaigns.length===0?"Rajzold meg az első kampányodat":"Nincs ilyen kampány"}</h3><p>{campaigns.length===0?"Válassz egy sablont, és építsd fel a folyamatot lépésről lépésre.":"Próbálj másik szűrőt vagy keresést."}</p>{campaigns.length===0&&<button className="button primary" onClick={create}><Plus size={17}/> Kampány létrehozása</button>}</div>:
      <div className="campaign-grid">{filtered.map(c=><button className="campaign-card" key={c.id} onClick={()=>open(c)}>
        <div className="card-top"><div className="card-symbol"><GitBranch size={22}/></div><span className={"badge "+c.status}>{stageLabels[c.status]}</span></div>
        <div className="card-client">{c.client||"Ügyfél nélkül"}</div><h3>{c.name}</h3><p>{c.objective||"A kampány célja még nincs megadva."}</p>
        <div className="card-flow"><span className="flow-dot"/><span className="flow-line"/><span className="flow-dot"/><span className="flow-line"/><span className="flow-dot"/></div>
        <div className="card-meta"><span>{c.nodes.length} lépés · {c.channel||"Csatorna nélkül"}</span><span>{date(c.startDate)}</span></div>
      </button>)}</div>}
    <div className="integration-strip"><div className="integration-icon"><Link2 size={19}/></div><div><strong>Bemutató verzió</strong><p>A módosításaid csak ebben a böngészőben maradnak meg. A CRM és Meta szinkron a következő fejlesztési lépés.</p></div><span className="coming-pill">Helyi mentés</span></div>
  </>;
}

function Editor({value,onChange,onSave,onBack,onDuplicate,onDelete,saving,dirty}:{
  value:Campaign;onChange:(c:Campaign)=>void;onSave:()=>void;onBack:()=>void;
  onDuplicate:()=>void;onDelete:()=>void;saving:boolean;dirty:boolean
}) {
  const [selected,setSelected]=useState<string|null>(null);
  const [connecting,setConnecting]=useState<string|null>(null);
  const [zoom,setZoom]=useState(1);
  const [tab,setTab]=useState<"step"|"campaign">("step");
  const scrollRef=useRef<HTMLDivElement>(null);
  const dragRef=useRef<{id:string;pointerX:number;pointerY:number;x:number;y:number}|null>(null);
  const current=selected?value.nodes.find(n=>n.id===selected):undefined;
  const update=(change:Partial<Campaign>)=>onChange({...value,...change});
  const updateNode=(id:string,change:Partial<Node>)=>update({nodes:value.nodes.map(n=>n.id===id?{...n,...change}:n)});
  function addNode(kind:Kind) {
    const id=crypto.randomUUID();
    const x=Math.max(60,Math.round(((scrollRef.current?.scrollLeft||0)+250)/zoom));
    const y=Math.max(70,Math.round(((scrollRef.current?.scrollTop||0)+150)/zoom));
    const n:Node={id,kind,title:kindLabels[kind],description:"",x,y,state:"planned",owner:"",target:"",actual:"",link:""};
    update({nodes:[...value.nodes,n]});setSelected(id);setTab("step");
  }
  function clickNode(id:string) {
    if(connecting) {
      if(id!==connecting && !value.edges.some(e=>e.from===connecting&&e.to===id))
        update({edges:[...value.edges,{id:crypto.randomUUID(),from:connecting,to:id}]});
      setConnecting(null);setSelected(id);
    } else {setSelected(id);setTab("step")}
  }
  function pointerDown(e:React.PointerEvent,id:string) {
    if(e.button!==0 || connecting) return;
    const n=value.nodes.find(n=>n.id===id);if(!n)return;
    dragRef.current={id,pointerX:e.clientX,pointerY:e.clientY,x:n.x,y:n.y};
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function pointerMove(e:React.PointerEvent) {
    const d=dragRef.current;if(!d)return;
    updateNode(d.id,{x:Math.max(12,Math.min(2250,Math.round(d.x+(e.clientX-d.pointerX)/zoom))),
      y:Math.max(12,Math.min(1080,Math.round(d.y+(e.clientY-d.pointerY)/zoom)))});
  }
  const deleteNode=()=>{if(!current)return;update({nodes:value.nodes.filter(n=>n.id!==current.id),edges:value.edges.filter(e=>e.from!==current.id&&e.to!==current.id)});setSelected(null)};
  const renderEdge=(edge:Edge)=>{
    const a=value.nodes.find(n=>n.id===edge.from),b=value.nodes.find(n=>n.id===edge.to);
    if(!a||!b)return null;
    const forward=b.x>=a.x, x1=a.x+(forward?252:0),x2=b.x+(forward?0:252),y1=a.y+78,y2=b.y+78;
    const bend=Math.max(70,Math.abs(x2-x1)*.45)*(forward?1:-1);
    return <path key={edge.id} d={"M "+x1+" "+y1+" C "+(x1+bend)+" "+y1+", "+(x2-bend)+" "+y2+", "+x2+" "+y2} className="edge" markerEnd="url(#arrow)"/>;
  };
  return <div className="editor">
    <div className="editor-head">
      <div className="editor-title"><button className="icon-button back" onClick={onBack} aria-label="Áttekintés"><ArrowLeft size={20}/></button><div><div className="breadcrumbs">Kampányok <span>/</span> {value.client||"Új ügyfél"}</div><h1>{value.name}</h1></div><span className={"badge "+value.status}>{stageLabels[value.status]}</span></div>
      <div className="editor-actions"><span className={"save-state "+(dirty?"unsaved":"")}>{dirty?"Nem mentett módosítások":"Mentve"}</span>
        <button className="button secondary details-toggle" onClick={()=>setTab("campaign")}><Settings2 size={17}/> Beállítások</button>
        <button className="button primary" disabled={!dirty||saving} onClick={onSave}><Save size={17}/>{saving?"Mentés…":"Mentés"}</button>
      </div>
    </div>
    <div className="editor-body">
      <aside className="palette"><div className="panel-heading"><span>Építőelemek</span><MousePointer2 size={16}/></div>
        <p className="panel-help">Kattints egy elemre, majd helyezd el a vásznon.</p>
        <div className="palette-list">{kinds.map(k=><button key={k} className={"palette-item kind-"+k} onClick={()=>addNode(k)}><span className="palette-icon"><span className="kind-glyph">{k==="audience"?"◎":k==="channel"?"◈":k==="landing"?"▣":k==="qualification"?"◇":k==="sales"?"◆":k==="measurement"?"▥":"✓"}</span></span><span>{kindLabels[k]}</span><Plus size={16}/></button>)}</div>
        <div className="palette-bottom"><div className="mini-tip"><GitBranch size={17}/><span>Lépések összekötéséhez válassz egy kártyát, majd kattints a <b>Kapcsolat</b> gombra.</span></div><div className="source-note">Bemutató · helyi böngészőadatok</div></div>
      </aside>
      <section className="canvas-area">
        <div className="canvas-toolbar"><div className="canvas-caption"><LayoutGrid size={17}/> Folyamatábra <span>{value.nodes.length} lépés · {value.edges.length} kapcsolat</span></div><div className="zoom-controls"><button onClick={()=>setZoom(z=>Math.max(.6,Math.round((z-.1)*10)/10))} aria-label="Kicsinyítés"><ZoomOut size={17}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(1.4,Math.round((z+.1)*10)/10))} aria-label="Nagyítás"><ZoomIn size={17}/></button></div></div>
        {connecting&&<div className="connect-hint"><Link2 size={17}/> Válaszd ki a cél lépést a kapcsolathoz. <button onClick={()=>setConnecting(null)}>Mégse</button></div>}
        <div ref={scrollRef} className="canvas-scroll" onClick={()=>{if(!connecting)setSelected(null)}}>
          <div className="canvas-scaled" style={{width:2350*zoom,height:1200*zoom}}>
            <div className="canvas-grid" style={{width:2350,height:1200,transform:"scale("+zoom+")",transformOrigin:"top left"}}>
              <svg className="connections" width="2350" height="1200" aria-hidden="true"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8d93ab"/></marker></defs>{value.edges.map(renderEdge)}</svg>
              {value.nodes.map(n=><div key={n.id} role="button" tabIndex={0} aria-label={n.title+" lépés"} onKeyDown={e=>{if(e.key==="Enter")clickNode(n.id)}} onClick={e=>{e.stopPropagation();clickNode(n.id)}}
                onPointerDown={e=>pointerDown(e,n.id)} onPointerMove={pointerMove} onPointerUp={()=>dragRef.current=null}
                className={"flow-node kind-"+n.kind+(selected===n.id?" selected":"")+(connecting===n.id?" source":"")}
                style={{left:n.x,top:n.y,touchAction:"none"}}>
                <div className="node-top"><span className="node-kind">{kindLabels[n.kind]}</span><span className={"step-dot "+n.state}/></div>
                <strong>{n.title}</strong><p>{n.description||"Részletek hozzáadása"}</p>
                <div className="node-footer"><span>{stateLabels[n.state]}</span><span>{n.actual||n.target||"—"}</span></div>
                <span className="port in"/><span className="port out"/>
              </div>)}
              {value.nodes.length===0&&<div className="canvas-empty"><div><Plus size={25}/></div><h3>Üres vászon</h3><p>Válassz egy építőelemet a bal oldali listából.</p></div>}
            </div>
          </div>
        </div>
      </section>
      <aside className="inspector">
        <div className="inspector-tabs"><button className={tab==="step"?"active":""} onClick={()=>setTab("step")}>Lépés</button><button className={tab==="campaign"?"active":""} onClick={()=>setTab("campaign")}>Kampány</button></div>
        {tab==="step" ? current ? <div className="inspector-content">
          <div className="inspector-heading"><div className={"inspector-icon kind-"+current.kind}>{kindLabels[current.kind].slice(0,1)}</div><div><small>{kindLabels[current.kind]}</small><h2>Lépés részletei</h2></div></div>
          <label className="field">Megnevezés<input value={current.title} onChange={e=>updateNode(current.id,{title:e.target.value})} maxLength={160}/></label>
          <label className="field">Típus<select value={current.kind} onChange={e=>updateNode(current.id,{kind:e.target.value as Kind})}>{kinds.map(k=><option key={k} value={k}>{kindLabels[k]}</option>)}</select></label>
          <label className="field">Leírás<textarea rows={3} value={current.description} onChange={e=>updateNode(current.id,{description:e.target.value})} placeholder="Mi történik ebben a lépésben?"/></label>
          <div className="field-row"><label className="field">Állapot<select value={current.state} onChange={e=>updateNode(current.id,{state:e.target.value as StepState})}>{states.map(s=><option key={s} value={s}>{stateLabels[s]}</option>)}</select></label><label className="field">Felelős<input value={current.owner} onChange={e=>updateNode(current.id,{owner:e.target.value})} placeholder="Név"/></label></div>
          <div className="inspector-divider"/>
          <div className="inspector-section-title"><BarChart3 size={17}/> Mérés <span>Kézi adat</span></div>
          <label className="field">Célérték / KPI<input value={current.target} onChange={e=>updateNode(current.id,{target:e.target.value})} placeholder="pl. 50 kvalifikált lead"/></label>
          <label className="field">Tényleges érték<input value={current.actual} onChange={e=>updateNode(current.id,{actual:e.target.value})} placeholder="pl. 32 lead"/></label>
          <label className="field">Kapcsolódó URL<input type="url" value={current.link} onChange={e=>updateNode(current.id,{link:e.target.value})} placeholder="https://..."/></label>
          {current.link&&/^https?:\/\//i.test(current.link)&&<a className="inline-link" href={current.link} target="_blank" rel="noopener noreferrer">Hivatkozás megnyitása</a>}
          <div className="inspector-divider"/>
          <div className="inspector-section-title"><Link2 size={17}/> Kapcsolatok</div>
          <button className="button secondary full-button" onClick={()=>setConnecting(current.id)}><Plus size={16}/> Kapcsolat indítása</button>
          {value.edges.filter(e=>e.from===current.id||e.to===current.id).map(e=>{
            const other=value.nodes.find(n=>n.id===(e.from===current.id?e.to:e.from));
            return <div className="edge-row" key={e.id}><span>{e.from===current.id?"→":"←"} {other?.title||"Ismeretlen"}</span><button aria-label="Kapcsolat törlése" onClick={()=>update({edges:value.edges.filter(x=>x.id!==e.id)})}><X size={16}/></button></div>;
          })}
          <button className="text-danger" onClick={deleteNode}><Trash2 size={16}/> Lépés törlése</button>
        </div> : <div className="inspector-placeholder"><MousePointer2 size={28}/><h3>Válassz egy lépést</h3><p>Kattints a vásznon egy kártyára az adatai szerkesztéséhez.</p></div>
        : <div className="inspector-content">
          <div className="inspector-heading"><div className="inspector-icon campaign"><Settings2 size={21}/></div><div><small>Beállítások</small><h2>Kampány adatai</h2></div></div>
          <label className="field">Kampány neve<input value={value.name} onChange={e=>update({name:e.target.value})} maxLength={160}/></label>
          <label className="field">Ügyfél<input value={value.client} onChange={e=>update({client:e.target.value})} maxLength={160}/></label>
          <label className="field">Üzleti cél<textarea rows={3} value={value.objective} onChange={e=>update({objective:e.target.value})}/></label>
          <label className="field">Állapot<select value={value.status} onChange={e=>update({status:e.target.value as Stage})}>{stages.map(s=><option value={s} key={s}>{stageLabels[s]}</option>)}</select></label>
          <p className="field-hint">Az éles állapot itt csak nyilvántartás. Nem indít hirdetést.</p>
          <label className="field">Csatornák<input value={value.channel} onChange={e=>update({channel:e.target.value})} placeholder="pl. Meta + LinkedIn"/></label>
          <label className="field">Tervezett keret (Ft)<input type="number" min="0" value={value.budget??""} onChange={e=>update({budget:e.target.value===""?null:Number(e.target.value)})} placeholder="Nincs megadva"/></label>
          <div className="field-row"><label className="field">Kezdés<input type="date" value={value.startDate} onChange={e=>update({startDate:e.target.value})}/></label><label className="field">Befejezés<input type="date" value={value.endDate} onChange={e=>update({endDate:e.target.value})}/></label></div>
          <div className="inspector-divider"/><div className="inspector-section-title">Kampányműveletek</div>
          <button className="button secondary full-button" onClick={onDuplicate}><Copy size={16}/> Másolat piszkozatként</button>
          <button className="text-danger" onClick={onDelete}><Trash2 size={16}/> Kampány törlése</button>
        </div>}
      </aside>
    </div>
  </div>;
}

export default function Planner({displayName}:{displayName:string}) {
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [selected,setSelected]=useState<Campaign|null>(null);
  const [view,setView]=useState<View>("all");
  const [query,setQuery]=useState("");
  const [newOpen,setNewOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{request("GET").then(d=>setCampaigns(d.items)).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  function open(c:Campaign){setSelected(clone(c));setDirty(false);setError("")}
  function change(c:Campaign){setSelected(c);setDirty(true)}
  async function create(c:Campaign) {
    const d=await request("POST",c);setCampaigns(prev=>[d.item,...prev]);setNewOpen(false);open(d.item);
  }
  async function save() {
    if(!selected||saving)return;
    setSaving(true);setError("");
    try {
      const d=await request("PUT",selected);
      setCampaigns(prev=>prev.map(c=>c.id===d.item.id?d.item:c));
      setSelected(d.item);setDirty(false);
    } catch(e){setError((e as Error).message)}finally{setSaving(false)}
  }
  async function duplicate() {
    if(!selected)return;
    try {
      const d=await request("POST",{...selected,id:"",name:selected.name+" – másolat",status:"draft"});
      setCampaigns(prev=>[d.item,...prev]);open(d.item);
    }catch(e){setError((e as Error).message)}
  }
  async function remove() {
    if(!selected||!window.confirm("Biztosan törlöd ezt a kampányt? Ez nem vonható vissza."))return;
    try{await request("DELETE",undefined,selected.id);setCampaigns(prev=>prev.filter(c=>c.id!==selected.id));setSelected(null);setDirty(false)}
    catch(e){setError((e as Error).message)}
  }
  function back(){if(dirty&&!window.confirm("A módosítások nincsenek elmentve. Kilépsz?"))return false;setSelected(null);setDirty(false);setError("");return true}
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue=""}};
    window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn)
  },[dirty]);
  return <div className="app-shell">
    <aside className="main-sidebar">
      <div className="brand"><div className="brand-mark"><GitBranch size={22}/></div><div><strong>FLOW<span>BOARD</span></strong><small>Training Hungary</small></div></div>
      <div className="sidebar-group-title">MUNKATERÜLET</div>
      <nav className="main-nav" aria-label="Fő navigáció">
        <button className={!selected&&view==="all"?"active":""} onClick={()=>{if(back())setView("all")}}><LayoutGrid size={19}/> Áttekintés</button>
        <button className={!selected&&view==="live"?"active":""} onClick={()=>{if(back())setView("live")}}><Play size={19}/> Futó kampányok <span>{campaigns.filter(c=>c.status==="live").length}</span></button>
        <button className={!selected&&view==="draft"?"active":""} onClick={()=>{if(back())setView("draft")}}><Layers3 size={19}/> Piszkozatok <span>{campaigns.filter(c=>c.status==="draft").length}</span></button>
        <button className={!selected&&view==="paused"?"active":""} onClick={()=>{if(back())setView("paused")}}><Pause size={19}/> Szünetelők</button>
      </nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-notice"><span className="notice-spark">✦</span><strong>A kampányod térképe</strong><p>A teljes út egyetlen szerkeszthető vásznon.</p><button onClick={()=>setNewOpen(true)}>Új terv készítése</button></div>
      <div className="profile"><span className="avatar">{displayName.charAt(0).toUpperCase()}</span><div><strong>{displayName}</strong><small>Bemutató verzió</small></div><MoreHorizontal size={18}/></div>
    </aside>
    <main className={"main "+(selected?"main-editor":"")}>
      {!selected&&<header className="topbar"><div className="topbar-breadcrumb">Training Hungary <span>/</span> Kampánytervező</div><div className="topbar-right"><span className="workspace-indicator"><span/> Bemutató · helyi mentés</span><button className="top-icon" onClick={()=>setNewOpen(true)} aria-label="Új kampány"><Plus size={19}/></button></div></header>}
      {error&&<div className="global-error" role="alert">{error}<button onClick={()=>setError("")} aria-label="Üzenet bezárása"><X size={16}/></button></div>}
      {selected ? <Editor key={selected.id} value={selected} onChange={change} onSave={save} onBack={back} onDuplicate={duplicate} onDelete={remove} saving={saving} dirty={dirty}/> :
        <div className="overview"><Overview campaigns={campaigns} view={view} setView={setView} open={open} create={()=>setNewOpen(true)} loading={loading} query={query} setQuery={setQuery}/></div>}
    </main>
    {newOpen&&<NewCampaign onClose={()=>setNewOpen(false)} onCreate={create}/>}
  </div>;
}
