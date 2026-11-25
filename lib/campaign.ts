export type Stage = "draft" | "live" | "paused" | "archived";
export type Kind = "audience" | "channel" | "landing" | "qualification" | "sales" | "measurement" | "task";
export type StepState = "planned" | "ready" | "running" | "blocked" | "done";
export type Node = {
  id: string; kind: Kind; title: string; description: string; x: number; y: number;
  state: StepState; owner: string; target: string; actual: string; link: string;
};
export type Edge = { id: string; from: string; to: string };
export type Campaign = {
  id: string; name: string; client: string; objective: string; status: Stage; channel: string;
  budget: number | null; startDate: string; endDate: string; nodes: Node[]; edges: Edge[];
  createdAt: string; updatedAt: string;
};
export const kindLabels: Record<Kind,string> = {
  audience:"Célcsoport",channel:"Csatorna",landing:"Érkezési pont",
  qualification:"Kvalifikálás",sales:"Értékesítés",measurement:"Mérés",task:"Feladat"
};
export const stateLabels: Record<StepState,string> = {
  planned:"Tervezett",ready:"Indítható",running:"Fut",blocked:"Elakadt",done:"Kész"
};
export const stageLabels: Record<Stage,string> = {
  draft:"Piszkozat",live:"Éles",paused:"Szünetel",archived:"Archivált"
};
const node = (id:string, kind:Kind, title:string, x:number, y:number, description=""):Node =>
  ({id,kind,title,x,y,description,state:"planned",owner:"",target:"",actual:"",link:""});
const path = (pairs:string[][]):Edge[] =>
  pairs.map(([from,to],i)=>({id:"e"+i,from,to}));
export const templates = {
  b2b: {
    title:"B2B leadgenerálás", channel:"Meta + CRM",
    nodes:[
      node("a","audience","Döntéshozók",80,180,"Kinek szól a kampány?"),
      node("b","channel","Hirdetés / megkeresés",390,180,"Üzenet, kreatív és költés"),
      node("c","landing","Űrlap / válasz",700,180,"Pozitív válasz és kontaktadat"),
      node("d","qualification","Marketing kvalifikálás",1010,180,"Ready to Sales / Remarketing / Kuka"),
      node("e","sales","Sales tárgyalás",1320,180,"Üzleti lehetőség és következő lépés")
    ],
    edges:path([["a","b"],["b","c"],["c","d"],["d","e"]])
  },
  webinar: {
    title:"Webinárium", channel:"Meta + e-mail + CRM",
    nodes:[
      node("a","audience","Célcsoport",80,180),
      node("b","channel","Meghívó kampány",390,180),
      node("c","landing","Regisztráció",700,180),
      node("d","task","Webinárium",1010,180),
      node("e","qualification","Utókövetés",1320,180),
      node("f","sales","Sales tárgyalás",1630,180)
    ],
    edges:path([["a","b"],["b","c"],["c","d"],["d","e"],["e","f"]])
  },
  linkedin: {
    title:"LinkedIn kapcsolatépítés",channel:"LinkedIn + CRM",
    nodes:[
      node("a","audience","Sales Navigator lista",80,180),
      node("b","channel","Kapcsolódás",390,180),
      node("c","channel","Értékadó üzenet",700,180),
      node("d","qualification","Marketing kvalifikálás",1010,180),
      node("e","sales","Sales tárgyalás",1320,180)
    ],
    edges:path([["a","b"],["b","c"],["c","d"],["d","e"]])
  },
  blank: {title:"Üres vászon",channel:"",nodes:[] as Node[],edges:[] as Edge[]}
};
