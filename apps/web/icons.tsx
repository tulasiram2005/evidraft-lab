import React from 'react';
type Props={size?:number;className?:string};
const paths={
 manuscript:<><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/></>,
 specimen:<><path d="M4 11.5V4h7.5L20 12.5 12.5 20z"/><circle cx="8" cy="8" r="1.3"/></>,
 check:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M7.8 10.7l2 2 3.6-4"/></>,
 seal:<><circle cx="12" cy="9.5" r="6"/><circle cx="12" cy="9.5" r="3" strokeDasharray="1 2"/><path d="M8.5 14.5L7 21l5-2.5 5 2.5-1.5-6.5"/></>,
 theme:<><circle cx="12" cy="12" r="7.5"/><path d="M12 4.5v15M12 4.5a7.5 7.5 0 010 15z"/></>,
 link:<><path d="M4 16C2 9 9 3 13 5M11 19c4 2 11-4 9-11M8 16l8-8"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="8" r="2"/></>,
 download:<><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>,
 upload:<><path d="M12 17V5m-4 4 4-4 4 4M4 16v5h16v-5"/></>,
 arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
 back:<path d="M20 12H4m6-6-6 6 6 6"/>,
 diagonal:<path d="M5 19 19 5M8 5h11v11"/>,
 plus:<path d="M12 4v16M4 12h16"/>,
 close:<path d="m5 5 14 14M19 5 5 19"/>,
 clock:<><circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 3"/></>,
 warning:<><path d="m12 3 10 18H2zM12 8v6"/><circle cx="12" cy="17" r=".6"/></>,
 menu:<path d="M4 6h16M4 12h16M4 18h16"/>,
 branch:<><path d="M6 4v16M6 14c10 0 12-5 12-10"/><circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="4" r="2"/></>,
 hash:<path d="M9 3 7 21M17 3l-2 18M3 9h18M3 15h18"/>,
 down:<path d="m5 8 7 7 7-7"/>,
 dots:<><circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/></>
};
function icon(name:keyof typeof paths){return function Icon({size=20,className=''}:Props){return <svg className={'custom-icon '+className} width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g stroke="#F6D743" transform="translate(1.6 1.6)">{paths[name]}</g><g stroke="currentColor">{paths[name]}</g></svg>;};}
export const BookOpen=icon('manuscript'),FileText=BookOpen,FlaskConical=icon('specimen'),ShieldCheck=icon('check'),Search=ShieldCheck,Check=ShieldCheck,CheckCircle2=ShieldCheck,History=icon('seal'),Lock=History,Sun=icon('theme'),Moon=Sun,Link2=icon('link'),Download=icon('download'),Upload=icon('upload'),ArrowRight=icon('arrow'),ChevronRight=ArrowRight,ArrowLeft=icon('back'),ArrowUpRight=icon('diagonal'),ExternalLink=ArrowUpRight,Plus=icon('plus'),X=icon('close'),Clock=icon('clock'),AlertTriangle=icon('warning'),Menu=icon('menu'),PanelLeftClose=Menu,Command=Menu,GitBranch=icon('branch'),Hash=icon('hash'),ChevronDown=icon('down'),MoreHorizontal=icon('dots'),Copy=FileText,Trash2=X;
