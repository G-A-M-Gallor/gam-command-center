import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { WidgetProvider } from "@/contexts/WidgetContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GAM Command Center",
  description: "Internal project management dashboard for G.A.M",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
var l=localStorage.getItem('cc-language')||'he';
document.documentElement.lang=l==='he'?'he':'en';
document.documentElement.dir=l==='he'?'rtl':'ltr';
var a=localStorage.getItem('cc-accent-color')||'purple';
var f=localStorage.getItem('cc-font-family')||'geist';
var r=localStorage.getItem('cc-border-radius')||'default';
var dn=localStorage.getItem('cc-density')||'default';
document.documentElement.dataset.accent=a;
document.documentElement.dataset.font=f;
document.documentElement.dataset.radius=r;
document.documentElement.dataset.density=dn;

function h2r(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}
function hslToRgb(H,S,L){H/=360;S/=100;L/=100;if(S===0){var v=Math.round(L*255);return[v,v,v]}var q=L<0.5?L*(1+S):L+S-L*S,p=2*L-q;return[Math.round(h2r(p,q,H+1/3)*255),Math.round(h2r(p,q,H)*255),Math.round(h2r(p,q,H-1/3)*255)]}
function toHex(c){return'#'+c.map(function(v){return v.toString(16).padStart(2,'0')}).join('')}
function hexToHSL(hex){var h=hex.replace('#','');var ri=parseInt(h.substring(0,2),16),gi=parseInt(h.substring(2,4),16),bi=parseInt(h.substring(4,6),16);var mx=Math.max(ri,gi,bi)/255,mn=Math.min(ri,gi,bi)/255,ll=(mx+mn)/2,ss=0,hh=0;if(mx!==mn){var dd=mx-mn;ss=ll>0.5?dd/(2-mx-mn):dd/(mx+mn);switch(mx){case ri/255:hh=((gi/255-bi/255)/dd+(gi<bi?6:0))/6;break;case gi/255:hh=((bi/255-ri/255)/dd+2)/6;break;case bi/255:hh=((ri/255-gi/255)/dd+4)/6;break}}return{h:hh*360,s:ss*100,l:ll*100}}
function hexToRgb(hex){var h=hex.replace('#','');return[parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16)]}
function applyPalette(prefix,hex){var el=document.documentElement.style;var hsl=hexToHSL(hex);var s5=Math.min(hsl.s+5,100);var c6=hexToRgb(hex),c5=hslToRgb(hsl.h,s5,Math.min(hsl.l+10,95)),c4=hslToRgb(hsl.h,s5,Math.min(hsl.l+22,95)),c3=hslToRgb(hsl.h,s5,Math.min(hsl.l+34,95));el.setProperty('--cc-'+prefix+'-300',toHex(c3));el.setProperty('--cc-'+prefix+'-400',toHex(c4));el.setProperty('--cc-'+prefix+'-500',toHex(c5));el.setProperty('--cc-'+prefix+'-600',hex);el.setProperty('--cc-'+prefix+'-600-20','rgba('+c6[0]+','+c6[1]+','+c6[2]+',0.2)');el.setProperty('--cc-'+prefix+'-600-30','rgba('+c6[0]+','+c6[1]+','+c6[2]+',0.3)');el.setProperty('--cc-'+prefix+'-500-15','rgba('+c5[0]+','+c5[1]+','+c5[2]+',0.15)');el.setProperty('--cc-'+prefix+'-500-30','rgba('+c5[0]+','+c5[1]+','+c5[2]+',0.3)');el.setProperty('--cc-'+prefix+'-500-50','rgba('+c5[0]+','+c5[1]+','+c5[2]+',0.5)')}

try{var bp=JSON.parse(localStorage.getItem('cc-brand-profile')||'{}');if(bp.brandPrimary)applyPalette('brand',bp.brandPrimary)}catch(e){}
try{var ch=localStorage.getItem('cc-custom-accent-hex');if(ch)applyPalette('custom',ch)}catch(e){}

try{var ef=JSON.parse(localStorage.getItem('cc-accent-effect')||'{}');var pm={purple:'#9333ea',blue:'#2563eb',emerald:'#059669',amber:'#d97706',rose:'#e11d48',cyan:'#0891b2'};var curHex=a==='custom'?ch:a==='brand'?(bp&&bp.brandPrimary||''):pm[a]||'';var el=document.documentElement.style;if(ef.gradient&&ef.gradient.enabled&&curHex){el.setProperty('--cc-accent-gradient','linear-gradient('+ef.gradient.direction+'deg, '+curHex+', '+ef.gradient.secondaryColor+')')}if(ef.glow&&ef.glow.enabled&&curHex){var gi=ef.glow.intensity||'subtle';var rgb=hexToRgb(curHex);var rs='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+',';var gs=gi==='strong'?'0 0 16px '+rs+'0.5), 0 0 32px '+rs+'0.3), 0 0 48px '+rs+'0.1)':gi==='medium'?'0 0 12px '+rs+'0.4), 0 0 24px '+rs+'0.2)':'0 0 8px '+rs+'0.3), 0 0 16px '+rs+'0.1)';el.setProperty('--cc-accent-glow',gs)}}catch(e){}

try{var vm=localStorage.getItem('cc-style-view-mode');if(vm!=='system'){var so=JSON.parse(localStorage.getItem('cc-style-overrides-personal')||'{}');var cssPropMap={backgroundColor:'background-color',color:'color',textHighlight:'box-shadow',borderColor:'border-color',fontFamily:'font-family',fontSize:'font-size',letterSpacing:'letter-spacing',lineHeight:'line-height'};var rules=[];for(var id in so){var s=so[id];var decls=[];for(var p in s){if(p==='textContent'||!s[p])continue;var cp=cssPropMap[p];if(!cp)continue;var v=p==='textHighlight'?'inset 0 -0.5em 0 '+s[p]:s[p];decls.push(cp+': '+v+' !important')}if(decls.length)rules.push('[data-cc-id="'+id+'"] { '+decls.join('; ')+'; }')}if(rules.length){var st=document.createElement('style');st.textContent=rules.join('\\n');document.head.appendChild(st)}}}catch(e){}
})();`,
          }}
        />
        <SettingsProvider>
          <WidgetProvider>{children}</WidgetProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
