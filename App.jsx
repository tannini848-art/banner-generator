import { useState, useRef } from "react";

const STYLES = ["科技感","节日喜庆","简约极简","渐变色彩","暗黑赛博朋克","温暖自然","高端奢华","卡通可爱","复古怀旧","几何图形"];
const PRESETS = [
  { label: "900×300", w: 900, h: 300 },
  { label: "1200×400", w: 1200, h: 400 },
  { label: "750×200", w: 750, h: 200 },
  { label: "600×600", w: 600, h: 600 },
  { label: "400×600", w: 400, h: 600 },
];

async function callClaude(apiKey, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `API 错误 ${res.status}`);
  }
  const data = await res.json();
  let html = data.content.map((b) => b.text || "").join("");
  html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/, "").trim();
  return html;
}

function ApiKeyModal({ onSave }) {
  const [val, setVal] = useState("");
  const [show, setShow] = useState(false);
  const valid = val.startsWith("sk-");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#13131a", border:"1px solid #2a2a3d", borderRadius:16, padding:36, width:420, maxWidth:"90vw" }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🔑</div>
        <h2 style={{ textAlign:"center", marginBottom:8, fontSize:18 }}>输入 Anthropic API Key</h2>
        <p style={{ color:"#7a7a9a", fontSize:13, textAlign:"center", marginBottom:24, lineHeight:1.6 }}>
          Key 仅保存在你的浏览器本地，不会上传任何服务器。<br/>
          前往 <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color:"#6c63ff" }}>console.anthropic.com</a> 获取
        </p>
        <div style={{ position:"relative", marginBottom:16 }}>
          <input type={show ? "text" : "password"} value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && valid && onSave(val)}
            placeholder="sk-ant-api03-..."
            style={{ background:"#1c1c28", border:"1px solid #2a2a3d", borderRadius:8, color:"#e8e8f0", fontFamily:"inherit", fontSize:14, padding:"10px 70px 10px 12px", width:"100%", outline:"none" }} />
          <button onClick={() => setShow(v => !v)}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#7a7a9a", cursor:"pointer", fontSize:12 }}>
            {show ? "隐藏" : "显示"}
          </button>
        </div>
        <button disabled={!valid} onClick={() => onSave(val)}
          style={{ width:"100%", padding:12, background: valid ? "linear-gradient(135deg,#6c63ff,#ff6b9d)" : "#2a2a3d", border:"none", borderRadius:10, color:"#fff", fontSize:15, fontWeight:700, cursor: valid ? "pointer" : "not-allowed", fontFamily:"inherit" }}>
          开始使用
        </button>
        <p style={{ color:"#444", fontSize:11, textAlign:"center", marginTop:12 }}>格式：sk-ant-api03-...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(!localStorage.getItem("anthropic_key"));

  const [title, setTitle]       = useState("送您最高17元支付券");
  const [subtitle, setSubtitle] = useState("限滴滴支付使用｜加油充电可用");
  const [cta, setCta]           = useState("立即领取");
  const [wStr, setWStr]         = useState("670");
  const [hStr, setHStr]         = useState("586");
  const [selStyles, setSelStyles] = useState(["简约极简"]);
  const [count, setCount]       = useState(3);
  const [extra, setExtra]       = useState("");
  const [banners, setBanners]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [prog, setProg]         = useState({ done:0, total:0, text:"" });
  const [toast, setToast]       = useState("");
  const [openCode, setOpenCode] = useState({});
  const htmlStore = useRef({});

  const previewW = Math.max(100, parseInt(wStr, 10) || 670);
  const previewH = Math.max(50,  parseInt(hStr, 10) || 586);

  function saveKey(k) { localStorage.setItem("anthropic_key", k); setApiKey(k); setShowKeyModal(false); }
  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }
  function toggleStyle(s) { setSelStyles(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]); }
  function pickStyles(idx) {
    const src = selStyles.length ? selStyles : ["简约极简"];
    if (src.length <= 2) return src;
    return [...src].sort(() => ((idx * 137 + 31) % 7) - 3).slice(0, 2);
  }

  async function generate() {
    if (loading) return;
    if (!title.trim()) { showToast("请填写主标题"); return; }
    const W = previewW, H = previewH;
    setLoading(true);
    htmlStore.current = {};
    setBanners(Array.from({ length: count }, (_, i) => ({ id:i, status:"loading", style:pickStyles(i).join("+"), w:W, h:H })));
    setProg({ done:0, total:count, text:"准备中..." });
    const results = [];
    for (let i = 0; i < count; i++) {
      const styles = pickStyles(i);
      setProg({ done:i, total:count, text:`生成第 ${i+1} / ${count} 个...` });
      const prompt = `你是专业UI设计师，严格按以下规格生成HTML Banner。

═══════════════════════════
文案（必须原文使用，禁止修改）
  主标题：${title}
  副标题：${subtitle || "（无）"}
  按钮文字：${cta}
═══════════════════════════
尺寸：${W}px 宽 × ${H}px 高
风格：${styles.join("、")}
额外要求：${extra || "无"}
变体编号：${i+1}（每个编号配色/字体/布局必须明显不同）
═══════════════════════════

输出规则：
① 只输出HTML代码，不要解释，不要markdown符号
② body { margin:0; padding:0; width:${W}px; height:${H}px; overflow:hidden; }
③ Banner必须精确填充 ${W}×${H} 空间
④ 可用CDN引入Google Fonts，可用CSS动画
⑤ 禁止<img>标签，装饰元素用CSS绘制
⑥ 文案100%原样使用，绝不自创替换任何文字
⑦ 从<!DOCTYPE html>直接开始输出`;

      try {
        const html = await callClaude(apiKey, prompt);
        htmlStore.current[i] = html;
        results.push({ id:i, status:"done", html, style:styles.join(" + "), w:W, h:H });
      } catch(e) {
        results.push({ id:i, status:"error", error:e.message, style:styles.join(" + "), w:W, h:H });
      }
      setBanners([...results, ...Array.from({ length:count-results.length }, (_,j) => ({ id:results.length+j, status:"loading", style:pickStyles(results.length+j).join("+"), w:W, h:H }))]);
    }
    setBanners(results);
    setProg({ done:count, total:count, text:"全部完成 ✓" });
    setLoading(false);
    showToast(`✅ 生成完成！共 ${results.filter(r=>r.status==="done").length} 个`);
    setTimeout(() => setProg({ done:0, total:0, text:"" }), 3000);
  }

  function copyHTML(idx) {
    const html = htmlStore.current[idx];
    if (html) navigator.clipboard.writeText(html).then(() => showToast("✅ HTML 已复制！"));
  }

  function downloadHTML(b) {
    const html = htmlStore.current[b.id];
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner_v${b.id+1}_${b.w}x${b.h}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("⬇️ 下载成功！");
  }

  const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0;
  const IS = { background:"#1c1c28", border:"1px solid #2a2a3d", borderRadius:8, color:"#e8e8f0", fontFamily:"inherit", fontSize:13, padding:"8px 10px", width:"100%", outline:"none" };
  const BS = { width:28, height:28, borderRadius:6, border:"1px solid #2a2a3d", background:"#1c1c28", color:"#e8e8f0", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };

  return (
    <>
      {showKeyModal && <ApiKeyModal onSave={saveKey} />}
      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>

        {/* SIDEBAR */}
        <div style={{ width:300, minWidth:300, background:"#13131a", borderRight:"1px solid #2a2a3d", overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>

          <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:12, borderBottom:"1px solid #2a2a3d" }}>
            <span style={{ background:"linear-gradient(135deg,#6c63ff,#ff6b9d)", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🎨</span>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>AI Banner 生成器</div>
              <div style={{ fontSize:10, color:"#7a7a9a" }}>Powered by Claude</div>
            </div>
            <button onClick={() => setShowKeyModal(true)} title="更换API Key"
              style={{ marginLeft:"auto", background:"#1c1c28", border:"1px solid #2a2a3d", borderRadius:6, color:"#7a7a9a", cursor:"pointer", padding:"4px 8px", fontSize:11 }}>
              🔑 Key
            </button>
          </div>

          {/* 文案 */}
          <Sec title="📝 文案内容">
            <Fld label="主标题 *"><input style={IS} value={title} onChange={e=>setTitle(e.target.value)} /></Fld>
            <Fld label="副标题"><textarea style={{...IS,minHeight:54,resize:"vertical"}} value={subtitle} onChange={e=>setSubtitle(e.target.value)} /></Fld>
            <Fld label="按钮文字"><input style={IS} value={cta} onChange={e=>setCta(e.target.value)} /></Fld>
          </Sec>

          {/* 尺寸 */}
          <Sec title="📐 尺寸规格">
            <div style={{ display:"flex", gap:8 }}>
              <Fld label="宽 (px)" flex={1}><input style={IS} value={wStr} onChange={e=>setWStr(e.target.value)} placeholder="670" /></Fld>
              <Fld label="高 (px)" flex={1}><input style={IS} value={hStr} onChange={e=>setHStr(e.target.value)} placeholder="586" /></Fld>
            </div>
            <div style={{ background:"#1c1c28", border:"1px solid #2a2a3d", borderRadius:8, padding:"7px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:"#7a7a9a" }}>生成将使用：</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#6c63ff", fontFamily:"monospace" }}>{previewW} × {previewH} px</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {PRESETS.map(p=>(
                <button key={p.label} onClick={()=>{setWStr(String(p.w));setHStr(String(p.h));}}
                  style={{ fontSize:11, padding:"3px 8px", borderRadius:5, border:"1px solid #2a2a3d", background:"#1c1c28", color:"#aaa", cursor:"pointer", fontFamily:"inherit" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </Sec>

          {/* 风格 */}
          <Sec title="🎨 设计风格">
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {STYLES.map(s => {
                const on = selStyles.includes(s);
                return <button key={s} onClick={()=>toggleStyle(s)}
                  style={{ padding:"4px 10px", borderRadius:20, fontSize:12, cursor:"pointer", border:"1px solid", fontFamily:"inherit",
                    background:on?"#6c63ff":"#1c1c28", borderColor:on?"#6c63ff":"#2a2a3d", color:on?"#fff":"#aaa" }}>{s}</button>;
              })}
            </div>
          </Sec>

          {/* 数量 */}
          <Sec title="🔢 生成数量">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>setCount(c=>Math.max(1,c-1))} style={BS}>−</button>
              <span style={{ fontWeight:700, fontSize:18, minWidth:24, textAlign:"center" }}>{count}</span>
              <button onClick={()=>setCount(c=>Math.min(8,c+1))} style={BS}>+</button>
              <span style={{ fontSize:12, color:"#7a7a9a" }}>个变体</span>
            </div>
          </Sec>

          {/* 额外 */}
          <Sec title="⚡ 额外要求">
            <textarea style={{...IS,minHeight:54,resize:"vertical"}} value={extra} onChange={e=>setExtra(e.target.value)} placeholder="配色偏好、特殊布局、品牌元素..." />
          </Sec>

          <button onClick={generate} disabled={loading}
            style={{ padding:13, background:loading?"#2a2a3d":"linear-gradient(135deg,#6c63ff,#ff6b9d)", border:"none", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
            {loading ? "⏳ 生成中..." : "✨ 批量生成 Banner"}
          </button>

          {prog.total > 0 && (
            <div>
              <div style={{ fontSize:12, color:"#7a7a9a", marginBottom:5 }}>{prog.text}</div>
              <div style={{ height:4, background:"#2a2a3d", borderRadius:2 }}>
                <div style={{ height:"100%", width:pct+"%", background:"linear-gradient(90deg,#6c63ff,#ff6b9d)", borderRadius:2, transition:"width .4s" }} />
              </div>
            </div>
          )}
        </div>

        {/* CANVAS */}
        <div style={{ flex:1, overflowY:"auto", padding:24, display:"flex", flexDirection:"column", gap:20, background:"#0a0a0f" }}>
          {banners.length === 0 ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#7a7a9a", textAlign:"center", gap:12 }}>
              <div style={{ fontSize:52, opacity:.3 }}>🖼️</div>
              <p style={{ fontSize:14, lineHeight:1.7 }}>填写左侧信息，点击「批量生成 Banner」<br/>AI 将严格按你的文案和尺寸生成</p>
            </div>
          ) : banners.map(b => {
            const bw = b.w, bh = b.h;
            const scale = Math.min(1, 820 / bw);
            const dw = Math.round(bw * scale);
            const dh = Math.round(bh * scale);
            return (
              <div key={b.id} style={{ background:"#13131a", border:"1px solid #2a2a3d", borderRadius:12, overflow:"hidden", animation:"slideUp .3s ease" }}>
                <div style={{ padding:"10px 14px", borderBottom:"1px solid #2a2a3d", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ background:b.status==="error"?"#c0392b":"#6c63ff", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>
                    变体 {b.id+1}
                  </span>
                  <span style={{ fontSize:11, color:"#7a7a9a" }}>🎨 {b.style}</span>
                  <span style={{ fontSize:11, color:"#555", fontFamily:"monospace" }}>📐{bw}×{bh}</span>
                  {b.status==="done" && (
                    <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                      <button onClick={()=>copyHTML(b.id)} title="复制HTML"
                        style={{ width:28, height:28, borderRadius:6, border:"1px solid #2a2a3d", background:"#1c1c28", color:"#aaa", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>📋</button>
                      <button onClick={()=>downloadHTML(b)} title="下载HTML文件"
                        style={{ width:28, height:28, borderRadius:6, border:"1px solid #2a2a3d", background:"#1c1c28", color:"#aaa", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>⬇️</button>
                    </div>
                  )}
                </div>

                <div style={{ padding:16, background:"#0d0d14", display:"flex", alignItems:"center", justifyContent:"center", minHeight:80 }}>
                  {b.status==="loading" && (
                    <div style={{ width:dw, height:Math.min(dh,300), borderRadius:8,
                      background:"linear-gradient(90deg,#1c1c28 25%,#2a2a3d 50%,#1c1c28 75%)",
                      backgroundSize:"200% 100%", animation:"shimmer 1.2s infinite" }} />
                  )}
                  {b.status==="done" && (
                    <div style={{ position:"relative", width:dw, height:dh, borderRadius:8, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.7)", flexShrink:0 }}>
                      <iframe srcDoc={b.html} scrolling="no"
                        style={{ position:"absolute", top:0, left:0, width:bw, height:bh, border:"none", transformOrigin:"top left", transform:`scale(${scale})` }} />
                    </div>
                  )}
                  {b.status==="error" && <div style={{ color:"#e74c3c", fontSize:13 }}>❌ {b.error}</div>}
                </div>

                {b.status==="done" && (
                  <>
                    <div style={{ padding:"8px 14px", borderTop:"1px solid #2a2a3d", fontSize:12, color:"#7a7a9a", display:"flex", alignItems:"center", gap:8 }}>
                      <span>尺寸 {bw} × {bh} px · 预览缩放 {Math.round(scale*100)}%</span>
                      <span style={{ marginLeft:"auto", color:"#6c63ff", cursor:"pointer", textDecoration:"underline", fontSize:11 }}
                        onClick={()=>setOpenCode(o=>({...o,[b.id]:!o[b.id]}))}>
                        {openCode[b.id]?"隐藏代码":"查看代码"}
                      </span>
                    </div>
                    {openCode[b.id] && (
                      <div style={{ padding:"0 14px 14px" }}>
                        <pre style={{ background:"#0a0a0f", border:"1px solid #2a2a3d", borderRadius:8, padding:12, fontSize:11, fontFamily:"monospace", color:"#7a7a9a", maxHeight:200, overflowY:"auto", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
                          {b.html}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, background:"#1c1c28", border:"1px solid #00d4aa", color:"#00d4aa", padding:"10px 16px", borderRadius:8, fontSize:13, fontWeight:500, zIndex:9999 }}>
          {toast}
        </div>
      )}
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{to{background-position:-200% 0}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#2a2a3d;border-radius:3px}
      `}</style>
    </>
  );
}

function Sec({ title, children }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:"#7a7a9a", textTransform:"uppercase", marginBottom:8 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{children}</div>
    </div>
  );
}
function Fld({ label, children, flex }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, flex }}>
      <label style={{ fontSize:12, color:"#7a7a9a" }}>{label}</label>
      {children}
    </div>
  );
}
