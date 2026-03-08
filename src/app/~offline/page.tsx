export default function OfflinePage() {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Offline — GAM CC</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *{margin:0;padding:0;box-sizing:border-box}
              body{background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
              .container{text-align:center;padding:2rem}
              .icon{font-size:4rem;margin-bottom:1.5rem;opacity:0.6}
              h1{font-size:1.5rem;font-weight:600;margin-bottom:0.75rem}
              p{color:#94a3b8;margin-bottom:2rem;max-width:24rem;line-height:1.6}
              button{background:#7c3aed;color:#fff;border:none;padding:0.75rem 2rem;border-radius:0.5rem;font-size:1rem;cursor:pointer;transition:background 0.2s}
              button:hover{background:#6d28d9}
              button:active{background:#5b21b6}
            `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="icon">&#x1F4E1;</div>
          <h1 id="title">אין חיבור לאינטרנט</h1>
          <p id="desc">
            לא ניתן לגשת לדף זה במצב אופליין. בדוק את חיבור האינטרנט ונסה שוב.
          </p>
          <button type="button" id="retry">נסה שוב</button>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var l=localStorage.getItem('cc-language')||'he';
              document.documentElement.lang=l==='he'?'he':'en';
              document.documentElement.dir=l==='he'?'rtl':'ltr';
              var titles={he:'אין חיבור לאינטרנט',en:'No Internet Connection',ru:'Нет подключения к интернету'};
              var descs={he:'לא ניתן לגשת לדף זה במצב אופליין. בדוק את חיבור האינטרנט ונסה שוב.',en:'This page is not available offline. Check your internet connection and try again.',ru:'Эта страница недоступна в автономном режиме. Проверьте подключение к интернету и повторите попытку.'};
              var btns={he:'נסה שוב',en:'Retry',ru:'Повторить'};
              document.getElementById('title').textContent=titles[l]||titles.en;
              document.getElementById('desc').textContent=descs[l]||descs.en;
              var btn=document.getElementById('retry');
              btn.textContent=btns[l]||btns.en;
              btn.addEventListener('click',function(){window.location.reload()});
            })();`,
          }}
        />
      </body>
    </html>
  );
}
