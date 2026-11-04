"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, Church } from "lucide-react";
import type { SiteIdentity } from "@/lib/types";

const links = [["ABOUT US","/about"],["MINISTRIES","/ministries"],["EVENTS","/events"],["SERMONS","/sermons"],["GALLERY","/gallery"],["CONTACT","/contact"]] as const;
export function Navbar({ identity }: { identity: SiteIdentity }) {
 const [open,setOpen]=useState(false);
 return <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/95 backdrop-blur-md">
  <div className="container-site flex h-[76px] items-center justify-between">
   <Link href="/" className="flex items-center gap-3" onClick={()=>setOpen(false)}><span className="grid h-11 w-11 place-items-center rounded-full bg-navy-900 text-gold-400"><Church size={22}/></span><span className="leading-tight"><span className="block font-display text-lg font-bold tracking-wide text-navy-950">WISDOM TO LIFE</span><span className="block text-[10px] font-semibold tracking-[.22em] text-gold-700">MINISTRY</span></span></Link>
   <nav className="hidden items-center gap-4 lg:flex" aria-label="Main navigation"><Link className="text-[11px] font-bold tracking-[.11em] text-navy-800 transition hover:text-gold-700" href="/">HOME</Link>{links.map(([label,href])=><Link key={href} className="text-[11px] font-bold tracking-[.11em] text-navy-800 transition hover:text-gold-700" href={href}>{label}</Link>)}<Link href="/give" className="btn-gold !px-6 !py-2.5">GIVE</Link></nav>
   <button onClick={()=>setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full text-navy-900 hover:bg-cream-100 lg:hidden" aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open}>{open?<X/>:<Menu/>}</button>
  </div>
  {open&&<nav className="border-t border-navy-100 bg-white px-5 py-4 shadow-lg lg:hidden" aria-label="Mobile navigation">{[["HOME","/"],...links.slice(0,5),["GIVE","/give"],links[5]].map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={`block border-b border-navy-50 px-3 py-3 text-sm font-semibold tracking-wide ${href==="/give"?"text-gold-700":"text-navy-900"}`}>{label}</Link>)}</nav>}
 </header>;
}
