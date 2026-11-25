import React from "react";
import { createRoot } from "react-dom/client";
import Planner from "./planner";
import "./style.css";

const root=document.getElementById("root");
if(root) createRoot(root).render(<React.StrictMode><Planner displayName="Bemutató" /></React.StrictMode>);
