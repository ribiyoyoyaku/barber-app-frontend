import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

function getToken() { return localStorage.getItem("barber_token"); }
function setToken(t) { localStorage.setItem("barber_token", t); }
function clearToken() { localStorage.removeItem("barber_token"); }

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401) { clearToken(); window.location.reload(); return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "エラーが発生しました");
  return data;
}

const today = new Date();
const fmt = (d) => { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,"0"); const day = String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; };
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 9).padStart(2, "0")}:00`);
function genId() { return "id_" + Math.random().toString(36).slice(2, 9); }
// 背景色を暗くして枠線色を生成
function chipBorder(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const d = (v) => Math.max(0, v - 55).toString(16).padStart(2,"0");
  return "#" + d(r) + d(g) + d(b);
}

const inp = {
  background: "#fff", border: "1px solid #dde3ec", color: "#2d3748",
  padding: "0.6rem 0.75rem", borderRadius: "8px", width: "100%",
  fontSize: "1rem", boxSizing: "border-box", outline: "none",
};
const lbl = {
  display: "block", color: "#8896aa", fontSize: "0.72rem",
  marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600",
};
const mkBtn = (variant = "primary") => ({
  padding: "0.6rem 1.3rem", borderRadius: "8px", cursor: "pointer",
  fontSize: "0.9rem", fontWeight: "600", border: "none",
  background: variant === "primary" ? "#6b9fd4" : variant === "danger" ? "#f87171" : "#f0f4f8",
  color: variant === "primary" ? "#fff" : variant === "danger" ? "#fff" : "#4a5568",
  WebkitTapHighlightColor: "transparent",
});

// ============================================================
// LOGIN
// ============================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true); setError("");
    try {
      const data = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await data.json();
      if (!data.ok) throw new Error(json.error);
      setToken(json.token); onLogin();
    } catch (e) { setError(e.message || "ログインに失敗しました"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem 2rem", width: "100%", maxWidth: "360px", boxShadow: "0 8px 32px rgba(80,100,140,0.12)", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✂</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#3d5a80", marginBottom: "0.3rem" }}>理容管理システム</h1>
        <p style={{ color: "#8896aa", fontSize: "0.83rem", marginBottom: "2rem" }}>パスワードを入力してください</p>
        <input type="password" style={{ ...inp, textAlign: "center", fontSize: "1.1rem", letterSpacing: "0.15em", marginBottom: "1rem" }}
          placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
        {error && <div style={{ color: "#f87171", fontSize: "0.83rem", marginBottom: "0.75rem" }}>{error}</div>}
        <button style={{ ...mkBtn("primary"), width: "100%", padding: "0.8rem", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loading}>{loading ? "確認中…" : "ログイン"}</button>
      </div>
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================
function Modal({ title, onClose, children }) {
  const isWide = typeof window !== "undefined" && window.innerWidth >= 640;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(60,80,100,0.45)", zIndex: 1000, display: "flex", alignItems: isWide ? "center" : "flex-end", justifyContent: "center", padding: isWide ? "1rem" : "0" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: isWide ? "16px" : "20px 20px 0 0", width: "100%", maxWidth: "600px", maxHeight: isWide ? "88vh" : "92vh", overflowY: "auto", boxShadow: isWide ? "0 8px 40px rgba(80,100,140,0.22)" : "0 -8px 32px rgba(80,100,140,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.25rem", borderBottom: "1px solid #eef1f6", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#3d5a80", fontWeight: "700" }}>{title}</span>
          <button onClick={onClose} style={{ background: "#f0f4f8", border: "none", color: "#8896aa", fontSize: "1.1rem", cursor: "pointer", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "1.25rem" }}>{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// BOOKING FORM
// ============================================================
function BookingForm({ booking, customers, services, staff, onSave, onClose }) {
  const [form, setForm] = useState(booking || {
    id: genId(), customerId: "", customerName: "",
    staffId: staff[0]?.id || "", serviceId: services[0]?.id || "",
    date: fmt(today), time: "10:00", slot: 0,
    status: "confirmed", price: services[0]?.price || 0, notes: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [customerSearch, setCustomerSearch] = useState(booking?.customerName || "");
  const [showCustomerList, setShowCustomerList] = useState(false);

  const handleService = (sid) => {
    const sv = services.find(s => s.id === sid);
    set("serviceId", sid);
    if (sv) set("price", sv.price);
  };
  const handleCustomer = (c) => {
    set("customerId", c.id);
    set("customerName", c.name);
    setCustomerSearch(c.name);
    setShowCustomerList(false);
  };
  const clearCustomer = () => {
    set("customerId", "");
    set("customerName", "");
    setCustomerSearch("");
    setShowCustomerList(false);
  };
  const filteredCustomers = customers.filter(c =>
    c.name.includes(customerSearch) || (c.phone || "").includes(customerSearch)
  );
  const selectedSv = services.find(s => s.id === form.serviceId);

  return (
    <div>
      {selectedSv && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.6rem 0.9rem", background: selectedSv.color + "88", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: selectedSv.color, flexShrink: 0 }} />
          {selectedSv.name}　{selectedSv.duration}分　¥{selectedSv.price.toLocaleString()}
        </div>
      )}
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <label style={lbl}>顧客</label>
        <div style={{ position: "relative" }}>
          <input
            style={{ ...inp, paddingRight: "2rem" }}
            placeholder="🔍 名前・電話番号で検索…"
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); set("customerId", ""); set("customerName", e.target.value); setShowCustomerList(true); }}
            onFocus={() => setShowCustomerList(true)}
          />
          {customerSearch && (
            <button onClick={clearCustomer} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0aec0", cursor: "pointer", fontSize: "1rem", padding: "0" }}>×</button>
          )}
        </div>
        {showCustomerList && customerSearch && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", boxShadow: "0 4px 16px rgba(80,100,140,0.15)", zIndex: 50, maxHeight: "200px", overflowY: "auto", marginTop: "2px" }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: "0.75rem 1rem", color: "#a0aec0", fontSize: "0.83rem" }}>該当なし（このまま新規として登録できます）</div>
            ) : (
              filteredCustomers.map(c => (
                <div key={c.id} onClick={() => handleCustomer(c)}
                  style={{ padding: "0.6rem 1rem", cursor: "pointer", borderBottom: "1px solid #f0f4f8", fontSize: "0.88rem" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f4f8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontWeight: "600", color: "#2d3748" }}>{c.name}</span>
                  {c.phone && <span style={{ color: "#8896aa", marginLeft: "0.5rem", fontSize: "0.78rem" }}>{c.phone}</span>}
                  <span style={{ color: "#a0aec0", marginLeft: "0.5rem", fontSize: "0.75rem" }}>来店{c.visits}回</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={lbl}>担当スタッフ</label>
          <select style={inp} value={form.staffId} onChange={e => set("staffId", e.target.value)}>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>サービス</label>
          <select style={inp} value={form.serviceId} onChange={e => handleService(e.target.value)}>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={lbl}>日付</label>
          <input type="date" style={inp} value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div>
          <label style={lbl}>時間</label>
          <select style={inp} value={form.time} onChange={e => set("time", e.target.value)}>
            {TIME_SLOTS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>料金 (¥)</label>
          <input type="number" style={inp} value={form.price} onChange={e => set("price", parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>ステータス</label>
        <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
          <option value="confirmed">確定</option>
          <option value="pending">仮予約</option>
          <option value="done">完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>メモ</label>
        <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }}
          value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={onClose}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), flex: 2 }} onClick={() => onSave(form)}>保存する</button>
      </div>
    </div>
  );
}

// ============================================================
// BOOKING CHIP
// ============================================================
function BookingChip({ booking, services, onClick }) {
  const sv = services.find(s => s.id === booking.serviceId);
  const bg = sv?.color || "#e8f0fe";
  return (
    <div onClick={onClick} style={{
      background: bg, borderRadius: "5px", padding: "3px 6px",
      cursor: "pointer", fontSize: "0.7rem", lineHeight: "1.4",
      border: `1px solid ${bg}`, flex: 1, minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#2d3748" }}>{booking.customerName || "—"}</div>
      <div style={{ color: "#5a6a7e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sv?.name}</div>
    </div>
  );
}

// ============================================================
// CALENDAR TAB
// ============================================================
// 1時間 = PX_PER_HOUR px
const PX_PER_HOUR = 60;
const MIN_PER_PX = 60 / PX_PER_HOUR; // 1px = 何分か
const START_HOUR = 9;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function timeToY(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return ((h - START_HOUR) + m / 60) * PX_PER_HOUR;
}

function CalendarTab({ bookings, setBookings, customers, services, staff }) {
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [view, setView] = useState("day");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const weekStart = (() => { const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay()); return d; })();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const bookingsOn = (dateStr) => bookings.filter(b => b.date === dateStr && b.status !== "cancelled");

  const saveBooking = async (b) => {
    setSaving(true);
    try {
      // 新規予約の場合、枠を自動割り当て
      let finalBooking = { ...b };
      const isNew = !bookings.find(x => x.id === b.id);
      if (isNew) {
        // 時間が重なる予約を検出（開始〜終了が被るもの）
        const toMinutes = (timeStr) => {
          const [h, m] = timeStr.split(":").map(Number);
          return h * 60 + m;
        };
        const newStart = toMinutes(b.time);
        const newSv = services.find(s => s.id === b.serviceId);
        const newEnd = newStart + (newSv?.duration || 60);

        const same = bookings.filter(x => {
          if (x.date !== b.date) return false;
          if (x.staffId !== b.staffId) return false;
          if (x.status === "cancelled") return false;
          if (x.id === b.id) return false;
          const xStart = toMinutes(x.time);
          const xSv = services.find(s => s.id === x.serviceId);
          const xEnd = xStart + (xSv?.duration || 60);
          // 時間が少しでも重なれば対象
          return newStart < xEnd && newEnd > xStart;
        });
        const slot0Taken = same.some(x => (x.slot ?? 0) === 0);
        const slot1Taken = same.some(x => x.slot === 1);
        if (!slot0Taken) finalBooking.slot = 0;
        else if (!slot1Taken) finalBooking.slot = 1;
        else { alert("この時間帯はすでに満枠です"); setSaving(false); return; }
      }
      await apiFetch("/api/bookings", { method: "POST", body: finalBooking });
      setBookings(prev => {
        const exists = prev.find(x => x.id === finalBooking.id);
        return exists ? prev.map(x => x.id === finalBooking.id ? finalBooking : x) : [...prev, finalBooking];
      });
      setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("この予約を削除しますか？")) return;
    try {
      await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
      setBookings(prev => prev.filter(x => x.id !== id));
      setModal(null);
    } catch (e) { alert(e.message); }
  };

  // 時間軸の目盛りラベル
  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR);

  // 日ビュー：スタッフ列ごとに予約チップを絶対配置
  const DayViewColumn = ({ staffMember }) => {
    const dayBookings = bookingsOn(fmt(currentDate)).filter(b => b.staffId === staffMember.id);
    const totalH = TOTAL_HOURS * PX_PER_HOUR;

    const handleColumnClick = (e) => {
      // クリック位置から時間を計算
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutes = Math.round((y / PX_PER_HOUR) * 60 / 30) * 30; // 30分単位
      const totalMinutes = START_HOUR * 60 + minutes;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h < START_HOUR || h >= END_HOUR) return;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setModal({ booking: null, prefill: { staffId: staffMember.id, date: fmt(currentDate), time: timeStr, slot: 0 } });
    };

    return (
      <div style={{ position: "relative", height: `${totalH}px`, borderLeft: "1px solid #e4eaf4", cursor: "crosshair", background: "#fff" }}
        onClick={handleColumnClick}>
        {/* 水平グリッド線 */}
        {hourLabels.map(h => (
          <div key={h} style={{
            position: "absolute", top: `${(h - START_HOUR) * PX_PER_HOUR}px`,
            left: 0, right: 0, borderTop: "1px solid #f0f4f8", pointerEvents: "none",
          }} />
        ))}
        {/* 30分線 */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => (
          <div key={i} style={{
            position: "absolute", top: `${i * PX_PER_HOUR + PX_PER_HOUR / 2}px`,
            left: 0, right: 0, borderTop: "1px dashed #f5f7fb", pointerEvents: "none",
          }} />
        ))}
        {/* 予約チップ */}
        {dayBookings.map(b => {
          const sv = services.find(s => s.id === b.serviceId);
          const duration = sv?.duration || 60;
          const top = timeToY(b.time);
          const height = Math.max((duration / 60) * PX_PER_HOUR - 2, 20);
          const bg = sv?.color || "#e8f0fe";
          const isSlot1 = (b.slot ?? 0) === 1;
          // 同じスタッフ・同じ時間帯に別のslotの予約があるか確認
          const hasPair = dayBookings.some(x => x.id !== b.id && x.time === b.time);
          return (
            <div key={b.id}
              onClick={e => { e.stopPropagation(); setModal({ booking: b }); }}
              style={{
                position: "absolute",
                top: `${top + 1}px`,
                left: hasPair && isSlot1 ? "50%" : "1px",
                width: hasPair ? (isSlot1 ? "calc(50% - 2px)" : "calc(50% - 1px)") : "calc(100% - 2px)",
                minHeight: `${height}px`,
                background: bg,
                borderRadius: "5px",
                padding: "2px 5px",
                cursor: "pointer",
                overflow: "visible",
                boxShadow: "0 1px 4px rgba(80,100,140,0.12)",
                border: "2px solid #b0bec8",
                zIndex: 2,
              }}>
              <div style={{ fontWeight: "700", fontSize: "0.7rem", color: "#2d3748", whiteSpace: "normal", wordBreak: "break-all", lineHeight: "1.3" }}>
                {b.time} {b.customerName || "—"}
              </div>
              {height > 30 && (
                <div style={{ fontSize: "0.65rem", color: "#5a6a7e", whiteSpace: "normal", wordBreak: "break-all", lineHeight: "1.3" }}>
                  {sv?.name}{sv ? ` ${sv.duration}分` : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {["day","week","month"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "0.4rem 0.85rem", background: view === v ? "#6b9fd4" : "#f0f4f8", color: view === v ? "#fff" : "#6b7c93", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "600" }}>
              {v === "day" ? "日" : v === "week" ? "週" : "月"}
            </button>
          ))}
        </div>
        <button onClick={() => {
          const d = new Date(currentDate);
          if (view === "week") d.setDate(d.getDate() - 7);
          else if (view === "month") d.setMonth(d.getMonth() - 1);
          else d.setDate(d.getDate() - 1);
          setCurrentDate(d);
        }} style={{ background: "#f0f4f8", border: "none", borderRadius: "8px", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "1rem" }}>‹</button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "#3d5a80", fontWeight: "700", minWidth: "100px", textAlign: "center" }}>
          {view === "month"
            ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
            : view === "week"
            ? `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月`
            : `${currentDate.getMonth() + 1}月${currentDate.getDate()}日(${WEEKDAYS[currentDate.getDay()]})`}
        </span>
        <button onClick={() => {
          const d = new Date(currentDate);
          if (view === "week") d.setDate(d.getDate() + 7);
          else if (view === "month") d.setMonth(d.getMonth() + 1);
          else d.setDate(d.getDate() + 1);
          setCurrentDate(d);
        }} style={{ background: "#f0f4f8", border: "none", borderRadius: "8px", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "1rem" }}>›</button>
        <button onClick={() => setCurrentDate(new Date(today))}
          style={{ padding: "0.4rem 0.75rem", background: "none", border: "1px solid #c8d4e3", color: "#6b7c93", borderRadius: "7px", cursor: "pointer", fontSize: "0.78rem" }}>今日</button>
        <button onClick={() => setModal({ booking: null })} style={{ ...mkBtn("primary"), marginLeft: "auto", padding: "0.45rem 1rem", fontSize: "0.88rem" }}>＋ 予約</button>
      </div>

      {/* Month View */}
      {view === "month" && (() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay();
        const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
        const cells = Array.from({ length: totalCells }, (_, i) => new Date(year, month, 1 - startDow + i));
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
        const maxShow = 2;
        return (
          <div style={{ borderRadius: "12px", border: "1px solid #e4eaf4", background: "#fff", overflowX: "auto" }}>
            <div style={{ minWidth: "560px" }}>
              {/* 曜日ヘッダー */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "2px solid #e4eaf4", background: "#f8fafd" }}>
                {WEEKDAYS.map((w, i) => (
                  <div key={w} style={{ textAlign: "center", padding: "0.45rem 0", fontSize: "0.72rem", fontWeight: "700", color: i === 0 ? "#e57373" : i === 6 ? "#64b5f6" : "#8896aa" }}>{w}</div>
                ))}
              </div>
              {/* 週ごとの行 */}
              {weeks.map((week, wi) => {
                const maxBks = Math.max(...week.map(d => bookingsOn(fmt(d)).length), 0);
                const rowH = Math.max(28 + Math.min(maxBks, maxShow) * 19 + (maxBks > maxShow ? 14 : 0), 72);
                return (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: wi < weeks.length - 1 ? "1px solid #f0f4f8" : "none" }}>
                    {week.map((d, di) => {
                      const isCurrentMonth = d.getMonth() === month;
                      const isToday = fmt(d) === fmt(today);
                      const dayBks = bookingsOn(fmt(d));
                      const shown = dayBks.slice(0, maxShow);
                      const hiddenCount = dayBks.length - maxShow;
                      return (
                        <div key={fmt(d)}
                          onClick={() => { setCurrentDate(d); setView("day"); }}
                          style={{
                            height: `${rowH}px`, padding: "3px", cursor: "pointer",
                            borderLeft: di > 0 ? "1px solid #f0f4f8" : "none",
                            background: isToday ? "#eef5ff" : !isCurrentMonth ? "#fafbfd" : "#fff",
                            overflow: "hidden", boxSizing: "border-box",
                          }}>
                          <div style={{
                            fontSize: "0.75rem", fontWeight: isToday ? "700" : "400",
                            color: isToday ? "#fff" : !isCurrentMonth ? "#c8d4e3" : di === 0 ? "#e57373" : di === 6 ? "#64b5f6" : "#3d5a80",
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: isToday ? "#4a8fd4" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: "2px",
                          }}>{d.getDate()}</div>
                          {shown.map(b => {
                            const sv = services.find(s => s.id === b.serviceId);
                            const bg = sv?.color || "#e8f0fe";
                            return (
                              <div key={b.id}
                                onClick={e => { e.stopPropagation(); setModal({ booking: b }); }}
                                style={{ background: bg, borderRadius: "3px", padding: "1px 3px", fontSize: "0.58rem", color: "#2d3748", fontWeight: "600", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", lineHeight: "1.4" }}>
                                {b.time} {b.customerName || "—"}
                              </div>
                            );
                          })}
                          {hiddenCount > 0 && (
                            <div style={{ fontSize: "0.58rem", color: "#6b9fd4", fontWeight: "700" }}>+{hiddenCount}件</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Week View（時間軸・メニュー長さで高さが変わる） */}
      {view === "week" && (
        <div style={{ borderRadius: "12px", border: "1px solid #e4eaf4", background: "#fff", overflow: "hidden" }}>
          {/* スクロールコンテナ（ヘッダーと本体を一緒にスクロール） */}
          <div style={{ overflowX: "auto" }}>
          {/* ヘッダー行（曜日・日付） */}
          <div style={{ display: "flex", borderBottom: "2px solid #e4eaf4", background: "#f8fafd", minWidth: "770px" }}>
            <div style={{ width: "44px", flexShrink: 0 }} />
            {days.map(d => {
              const isToday = fmt(d) === fmt(today);
              return (
                <div key={fmt(d)} onClick={() => { setCurrentDate(d); setView("day"); }}
                  style={{ flex: 1, textAlign: "center", padding: "0.5rem 0.2rem", borderLeft: "1px solid #e4eaf4", cursor: "pointer", background: isToday ? "#eef5ff" : "#f8fafd", minWidth: "110px" }}>
                  <div style={{ fontSize: "0.62rem", color: "#8896aa", fontWeight: "600" }}>{WEEKDAYS[d.getDay()]}</div>
                  <div style={{ fontSize: "1rem", fontFamily: "var(--font-display)", color: isToday ? "#4a8fd4" : "#3d5a80", fontWeight: isToday ? "700" : "400" }}>{d.getDate()}</div>
                  <div style={{ fontSize: "0.6rem", color: "#a0aec0" }}>{bookingsOn(fmt(d)).length}件</div>
                </div>
              );
            })}
          </div>
          {/* 時間軸本体 */}
          <div style={{ display: "flex", minWidth: "770px" }}>
            {/* 時間ラベル列 */}
            <div style={{ width: "44px", flexShrink: 0, position: "relative", height: `${TOTAL_HOURS * PX_PER_HOUR}px`, background: "#fafbfe" }}>
              {hourLabels.map(h => (
                <div key={h} style={{
                  position: "absolute", top: `${(h - START_HOUR) * PX_PER_HOUR - 7}px`,
                  right: "4px", fontSize: "0.62rem", color: "#b0bec8", userSelect: "none",
                }}>
                  {`${String(h).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            {/* 曜日ごとの列 */}
            {days.map(d => {
              const isToday = fmt(d) === fmt(today);
              const dayBks = bookingsOn(fmt(d));
              const totalH = TOTAL_HOURS * PX_PER_HOUR;
              const handleColClick = (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const minutes = Math.round((y / PX_PER_HOUR) * 60 / 30) * 30;
                const totalMinutes = START_HOUR * 60 + minutes;
                const hh = Math.floor(totalMinutes / 60);
                const mm = totalMinutes % 60;
                if (hh < START_HOUR || hh >= END_HOUR) return;
                const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
                setModal({ booking: null, prefill: { date: fmt(d), time: timeStr, slot: 0 } });
              };
              return (
                <div key={fmt(d)} style={{ flex: 1, position: "relative", height: `${totalH}px`, borderLeft: "1px solid #e4eaf4", cursor: "crosshair", background: isToday ? "#fafcff" : "#fff", minWidth: "110px" }}
                  onClick={handleColClick}>
                  {/* グリッド線 */}
                  {hourLabels.map(h => (
                    <div key={h} style={{ position: "absolute", top: `${(h - START_HOUR) * PX_PER_HOUR}px`, left: 0, right: 0, borderTop: "1px solid #f0f4f8", pointerEvents: "none" }} />
                  ))}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={i} style={{ position: "absolute", top: `${i * PX_PER_HOUR + PX_PER_HOUR / 2}px`, left: 0, right: 0, borderTop: "1px dashed #f5f7fb", pointerEvents: "none" }} />
                  ))}
                  {/* 予約チップ */}
                  {(() => {
                    // 時間とスタッフで予約をグループ化
                    const timeGroups = {};
                    dayBks.forEach(b => {
                      const key = b.time;
                      if (!timeGroups[key]) timeGroups[key] = [];
                      timeGroups[key].push(b);
                    });
                    
                    return Object.entries(timeGroups).map(([time, bookings]) => {
                      // 同じ時間の予約をスタッフでソート
                      const sortedBookings = bookings.sort((a, b) => {
                        const staffA = staff.find(s => s.id === a.staffId);
                        const staffB = staff.find(s => s.id === b.staffId);
                        return (staffA?.sortOrder || 0) - (staffB?.sortOrder || 0);
                      });
                      
                      return sortedBookings.map((b, index) => {
                        const sv = services.find(s => s.id === b.serviceId);
                        const duration = sv?.duration || 60;
                        const top = timeToY(b.time);
                        const height = Math.max((duration / 60) * PX_PER_HOUR - 2, 16);
                        const bg = sv?.color || "#e8f0fe";
                        const totalInSlot = sortedBookings.length;
                        const width = totalInSlot > 1 ? `calc(${100 / totalInSlot}% - 2px)` : "calc(100% - 2px)";
                        const left = totalInSlot > 1 ? `${(index * 100 / totalInSlot)}%` : "1px";
                        
                        return (
                          <div key={b.id}
                            onClick={e => { e.stopPropagation(); setModal({ booking: b }); }}
                            style={{
                              position: "absolute",
                              top: `${top + 1}px`,
                              left: left,
                              width: width,
                              minHeight: `${height}px`,
                              background: bg,
                              borderRadius: "4px",
                              padding: "1px 3px",
                              cursor: "pointer",
                              overflow: "visible",
                              boxShadow: "0 1px 3px rgba(80,100,140,0.1)",
                              border: "2px solid #b0bec8",
                              zIndex: 2,
                            }}>
                            <div style={{ fontWeight: "700", fontSize: "0.62rem", color: "#2d3748", whiteSpace: "normal", wordBreak: "break-all", lineHeight: "1.3" }}>
                              {b.customerName || "—"}
                            </div>
                            {height > 24 && (
                              <div style={{ fontSize: "0.58rem", color: "#5a6a7e", whiteSpace: "normal", wordBreak: "break-all", lineHeight: "1.3" }}>
                                {sv?.name}
                              </div>
                            )}
                          </div>
                        );
                      });
                    });
                  })()}
                </div>
              );
            })}
          </div>
          </div>{/* /overflowX scroll container */}
        </div>
      )}

      {/* Day View（時間軸・メニュー長さで高さが変わる） */}
      {view === "day" && (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e4eaf4", background: "#fff" }}>
          {/* ヘッダー行（スタッフ名） */}
          <div style={{ display: "flex", borderBottom: "2px solid #e4eaf4", background: "#f8fafd", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ width: "44px", flexShrink: 0 }} />
            {staff.map(s => (
              <div key={s.id} style={{ flex: 1, textAlign: "center", padding: "0.6rem 0.2rem", borderLeft: "1px solid #e4eaf4" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: s.color, marginRight: "4px", verticalAlign: "middle" }} />
                <span style={{ fontSize: "0.8rem", color: "#3d5a80", fontWeight: "600" }}>{s.name}</span>
              </div>
            ))}
          </div>
          {/* 時間軸グリッド本体 */}
          <div style={{ display: "flex" }}>
            {/* 時間ラベル列 */}
            <div style={{ width: "44px", flexShrink: 0, position: "relative", height: `${TOTAL_HOURS * PX_PER_HOUR}px`, background: "#fafbfe" }}>
              {hourLabels.map(h => (
                <div key={h} style={{
                  position: "absolute", top: `${(h - START_HOUR) * PX_PER_HOUR - 7}px`,
                  right: "4px", fontSize: "0.62rem", color: "#b0bec8", userSelect: "none",
                }}>
                  {`${String(h).padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
            {/* スタッフごとの列 */}
            {staff.map(s => (
              <div key={s.id} style={{ flex: 1, minWidth: "110px" }}>
                <DayViewColumn staffMember={s} />
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal.booking ? "予約を編集" : "新規予約"} onClose={() => setModal(null)}>
          <BookingForm
            booking={modal.booking || (modal.prefill ? {
              id: genId(), customerId: "", customerName: "",
              staffId: modal.prefill.staffId || staff[0]?.id || "",
              serviceId: services[0]?.id || "",
              status: "confirmed", price: services[0]?.price || 0, notes: "",
              ...modal.prefill,
            } : null)}
            customers={customers} services={services} staff={staff}
            onSave={saveBooking} onClose={() => setModal(null)}
          />
          {modal.booking && (
            <button onClick={() => deleteBooking(modal.booking.id)}
              style={{ ...mkBtn("danger"), width: "100%", marginTop: "0.75rem" }}>この予約を削除</button>
          )}
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CUSTOMERS TAB
// ============================================================
function CustomersTab({ customers, setCustomers, bookings, services }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = customers.filter(c => c.name.includes(search) || (c.phone || "").includes(search));

  const saveCustomer = async (c) => {
    setSaving(true);
    try {
      await apiFetch("/api/customers", { method: "POST", body: c });
      setCustomers(prev => {
        const exists = prev.find(x => x.id === c.id);
        return exists ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
      });
      setEditing(null);
      setSelected(c);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("顧客を削除しますか？")) return;
    try {
      await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      setCustomers(prev => prev.filter(x => x.id !== id));
      setSelected(null); setShowDetail(false);
    } catch (e) { alert(e.message); }
  };

  const customerBookings = selected
    ? bookings.filter(b => b.customerId === selected.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  // Customer detail modal for mobile
  const CustomerDetail = () => (
    <Modal title={selected?.name || ""} onClose={() => setShowDetail(false)}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button style={mkBtn("ghost")} onClick={() => { setEditing(selected); setShowDetail(false); }}>編集</button>
        <button style={mkBtn("danger")} onClick={() => deleteCustomer(selected.id)}>削除</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
        {[["来店",`${selected.visits}回`,"#4a8fd4"],["最終",selected.lastVisit?.slice(5)||"—","#3d5a80"],["累計",`¥${(selected.totalSpent||0).toLocaleString()}`,"#6bbf8f"]].map(([k,v,c]) => (
          <div key={k} style={{ background: "#f4f8ff", borderRadius: "10px", padding: "0.75rem 0.5rem", textAlign: "center" }}>
            <div style={{ color: "#8896aa", fontSize: "0.65rem", fontWeight: "600" }}>{k}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {selected.notes && (
        <div style={{ background: "#fffbf0", border: "1px solid #f0e6c8", borderRadius: "8px", padding: "0.7rem", marginBottom: "1rem", fontSize: "0.83rem", color: "#5a4a2a" }}>
          📝 {selected.notes}
        </div>
      )}
      <div style={{ color: "#8896aa", fontSize: "0.72rem", fontWeight: "600", marginBottom: "0.5rem" }}>来店履歴</div>
      {customerBookings.length === 0
        ? <div style={{ color: "#a0aec0", fontSize: "0.83rem" }}>記録なし</div>
        : customerBookings.map(b => {
          const sv = services.find(s => s.id === b.serviceId);
          return (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f4f8", fontSize: "0.83rem" }}>
              <span style={{ color: "#8896aa" }}>{b.date}</span>
              <span>{sv?.name || "—"}</span>
              <span style={{ color: "#4a8fd4", fontWeight: "600" }}>¥{b.price.toLocaleString()}</span>
            </div>
          );
        })}
    </Modal>
  );

  if (editing) return (
    <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem" }}>
      <h3 style={{ fontFamily: "var(--font-display)", color: "#3d5a80", marginBottom: "1rem", fontSize: "1rem" }}>{editing.name ? "顧客情報の編集" : "新規顧客"}</h3>
      {[["name","氏名"],["phone","電話番号"],["email","メールアドレス"]].map(([k, l]) => (
        <div key={k} style={{ marginBottom: "0.85rem" }}>
          <label style={lbl}>{l}</label>
          <input style={inp} value={editing[k]} onChange={e => setEditing(x => ({ ...x, [k]: e.target.value }))} />
        </div>
      ))}
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>メモ</label>
        <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }} value={editing.notes} onChange={e => setEditing(x => ({ ...x, notes: e.target.value }))} />
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={() => setEditing(null)}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={() => saveCustomer(editing)} disabled={saving}>{saving ? "保存中…" : "保存する"}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input placeholder="🔍 顧客を検索…" style={{ ...inp, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} />
        <button style={mkBtn("primary")} onClick={() => setEditing({ id: genId(), name: "", phone: "", email: "", notes: "", visits: 0, lastVisit: "", totalSpent: 0 })}>＋</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {filtered.map(c => (
          <div key={c.id} onClick={() => { setSelected(c); setShowDetail(true); }}
            style={{ padding: "0.85rem 1rem", background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "10px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: "600", fontSize: "0.95rem", color: "#2d3748" }}>{c.name}</div>
              <div style={{ color: "#8896aa", fontSize: "0.75rem" }}>{c.phone || "—"} · 来店 {c.visits}回</div>
            </div>
            <span style={{ color: "#c8d4e3", fontSize: "1.2rem" }}>›</span>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: "#a0aec0", textAlign: "center", padding: "2rem", fontSize: "0.85rem" }}>該当する顧客がいません</div>}
      </div>
      {showDetail && selected && <CustomerDetail />}
    </div>
  );
}

// ============================================================
// SALES TAB
// ============================================================
function SalesTab({ bookings, services, staff, customers }) {
  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  // CSVダウンロード
  const downloadCSV = (rows, filename) => {
    const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = rows.map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBookings = () => {
    const header = ["日付", "時間", "顧客名", "担当スタッフ", "メニュー", "料金", "ステータス", "メモ"];
    const rows = bookings.map(b => {
      const sv = services.find(s => s.id === b.serviceId);
      const st = staff.find(s => s.id === b.staffId);
      return [b.date, b.time, b.customerName || "", st?.name || "", sv?.name || "", b.price, b.status, b.notes || ""];
    });
    downloadCSV([header, ...rows], `予約データ_${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}.csv`);
  };

  const downloadCustomers = () => {
    const header = ["氏名", "電話番号", "メールアドレス", "来店回数", "最終来店", "累計金額", "メモ"];
    const rows = (customers || []).map(c => [c.name, c.phone || "", c.email || "", c.visits || 0, c.lastVisit || "", c.totalSpent || 0, c.notes || ""]);
    downloadCSV([header, ...rows], `顧客データ_${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}.csv`);
  };
  const active = bookings.filter(b => b.status !== "cancelled");
  const monthly = {};
  active.forEach(b => { const m = b.date.slice(0, 7); monthly[m] = (monthly[m] || 0) + b.price; });
  const monthKeys = Object.keys(monthly).sort();
  const maxMonthly = Math.max(...Object.values(monthly), 1);
  const thisMonth = active.filter(b => b.date.startsWith(selectedMonth));
  const totalThisMonth = thisMonth.reduce((a, b) => a + b.price, 0);
  const bookingsThisMonth = thisMonth.length;
  const staffRev = {};
  thisMonth.forEach(b => { staffRev[b.staffId] = (staffRev[b.staffId] || 0) + b.price; });
  const svRev = {};
  thisMonth.forEach(b => { svRev[b.serviceId] = (svRev[b.serviceId] || 0) + b.price; });

  const Bar = ({ label, value, max, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
      <div style={{ width: "80px", fontSize: "0.75rem", color: "#6b7c93", textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ flex: 1, background: "#eef1f7", borderRadius: "5px", height: "24px", overflow: "hidden" }}>
        <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "#6b9fd4", borderRadius: "5px", minWidth: value > 0 ? "4px" : "0" }} />
      </div>
      <div style={{ width: "70px", textAlign: "right", fontSize: "0.75rem", color: "#2d3748", fontWeight: "600", flexShrink: 0 }}>¥{value.toLocaleString()}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[["今月売上",`¥${totalThisMonth.toLocaleString()}`,"#4a8fd4"],["予約件数",`${bookingsThisMonth}件`,"#3d5a80"],["客単価",`¥${bookingsThisMonth > 0 ? Math.round(totalThisMonth / bookingsThisMonth).toLocaleString() : 0}`,"#6bbf8f"]].map(([k,v,c]) => (
          <div key={k} style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1rem 0.75rem" }}>
            <div style={{ color: "#8896aa", fontSize: "0.65rem", textTransform: "uppercase", fontWeight: "600" }}>{k}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: c, marginTop: "0.2rem" }}>{v}</div>
          </div>
        ))}
      </div>
      {/* バックアップCSVダウンロード */}
      <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1rem", marginBottom: "1rem" }}>
        <div style={{ color: "#8896aa", fontSize: "0.7rem", fontWeight: "600", marginBottom: "0.6rem" }}>💾 データのバックアップ</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={downloadBookings} style={{ ...mkBtn("primary"), fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
            📅 予約データをCSVで保存
          </button>
          <button onClick={downloadCustomers} style={{ ...mkBtn("ghost"), fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
            👤 顧客データをCSVで保存
          </button>
        </div>
        <div style={{ color: "#a0aec0", fontSize: "0.72rem", marginTop: "0.5rem" }}>月1回ダウンロードして保存しておくと安心です</div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inp, width: "auto" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ color: "#8896aa", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "600", marginBottom: "0.75rem" }}>月次売上推移</div>
          {monthKeys.length === 0 ? <div style={{ color: "#a0aec0", fontSize: "0.83rem" }}>データなし</div> : monthKeys.map(m => <Bar key={m} label={m.slice(5)+"月"} value={monthly[m]} max={maxMonthly} color="#6b9fd4" />)}
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ color: "#8896aa", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "600", marginBottom: "0.75rem" }}>スタッフ別売上</div>
          {staff.map(s => <Bar key={s.id} label={s.name} value={staffRev[s.id] || 0} max={Math.max(...staff.map(x => staffRev[x.id] || 0), 1)} color={s.color} />)}
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ color: "#8896aa", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "600", marginBottom: "0.75rem" }}>メニュー別売上</div>
          {services.map(sv => <Bar key={sv.id} label={sv.name} value={svRev[sv.id] || 0} max={Math.max(...services.map(s => svRev[s.id] || 0), 1)} color={sv.color} />)}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MENU MANAGEMENT
// ============================================================
const COLOR_PRESETS = ["#fde8b0","#c8e6fb","#ffd6d6","#e8d5f5","#d5f0e8","#ffe5c8","#d5eaf5","#f5d5e8","#e8f5d5","#f5e8d5","#dff5f5","#f5dfd5"];

function MenuManagementTab({ services, setServices }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyService = () => ({ id: "sv_" + Math.random().toString(36).slice(2, 9), name: "", duration: 30, price: 0, color: "#fde8b0" });

  const saveService = async (sv) => {
    if (!sv.name.trim()) return alert("メニュー名を入力してください");
    setSaving(true);
    try {
      const updated = services.find(s => s.id === sv.id) ? services.map(s => s.id === sv.id ? sv : s) : [...services, sv];
      await apiFetch("/api/services", { method: "POST", body: updated });
      setServices(updated); setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteService = async (id) => {
    if (!window.confirm("このメニューを削除しますか？")) return;
    try {
      const updated = services.filter(s => s.id !== id);
      await apiFetch("/api/services", { method: "POST", body: updated });
      setServices(updated);
    } catch (e) { alert(e.message); }
  };

  const setEdit = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  if (editing) return (
    <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem" }}>
      <div style={{ fontFamily: "var(--font-display)", color: "#3d5a80", fontWeight: "700", fontSize: "1rem", marginBottom: "1rem" }}>
        {services.find(s => s.id === editing.id) ? "メニューを編集" : "新規メニュー"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.75rem", background: editing.color + "55", borderRadius: "8px", marginBottom: "1rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: editing.color, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{editing.name || "メニュー名"}</div>
          <div style={{ fontSize: "0.75rem", color: "#5a6a7e" }}>{editing.duration}分 ／ ¥{(editing.price || 0).toLocaleString()}</div>
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>メニュー名</label>
        <input style={inp} value={editing.name} onChange={e => setEdit("name", e.target.value)} placeholder="例: カット" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label style={lbl}>所要時間（分）</label>
          <input type="number" style={inp} value={editing.duration} min={5} step={5} onChange={e => setEdit("duration", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label style={lbl}>料金（¥）</label>
          <input type="number" style={inp} value={editing.price} min={0} onChange={e => setEdit("price", parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={lbl}>表示色</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => setEdit("color", c)}
              style={{ width: "28px", height: "28px", borderRadius: "6px", background: c, cursor: "pointer", border: editing.color === c ? "2.5px solid #4a8fd4" : "1px solid #dde3ec" }} />
          ))}
          <input type="color" value={editing.color} onChange={e => setEdit("color", e.target.value)}
            style={{ width: "28px", height: "28px", padding: "1px", border: "1px solid #dde3ec", borderRadius: "6px", cursor: "pointer" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={() => setEditing(null)}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={() => saveService(editing)} disabled={saving}>{saving ? "保存中…" : "保存する"}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ color: "#3d5a80", fontFamily: "var(--font-display)", fontWeight: "700" }}>メニュー一覧</div>
        <button style={mkBtn("primary")} onClick={() => setEditing(emptyService())}>＋ 追加</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {services.map(sv => (
          <div key={sv.id} style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: sv.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "0.92rem" }}>{sv.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#8896aa" }}>{sv.duration}分 ／ ¥{sv.price.toLocaleString()}</div>
            </div>
            <button style={{ ...mkBtn("ghost"), padding: "0.4rem 0.75rem", fontSize: "0.82rem" }} onClick={() => setEditing({ ...sv })}>編集</button>
            <button style={{ ...mkBtn("danger"), padding: "0.4rem 0.75rem", fontSize: "0.82rem" }} onClick={() => deleteService(sv.id)}>削除</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STAFF MANAGEMENT
// ============================================================
const STAFF_COLORS = ["#f0a8a8","#a8c8f0","#b8e0c8","#f5d5a8","#d5a8f5","#a8f5d5","#f5a8d5","#d5f5a8","#a8d5f5","#f5f5a8","#c8b8f0","#f0c8b8"];

function StaffManagementTab({ staff, setStaff }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyStaff = () => ({ id: "st_" + Math.random().toString(36).slice(2, 9), name: "", color: "#a8c8f0", sortOrder: staff.length });

  const saveStaff = async (s) => {
    if (!s.name.trim()) return alert("スタッフ名を入力してください");
    setSaving(true);
    try {
      await apiFetch("/api/staff", { method: "POST", body: s });
      setStaff(prev => {
        const exists = prev.find(x => x.id === s.id);
        return exists ? prev.map(x => x.id === s.id ? s : x) : [...prev, s];
      });
      setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("このスタッフを削除しますか？")) return;
    try {
      await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      setStaff(prev => prev.filter(s => s.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) { alert(e.message); }
  };

  const setEdit = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  if (editing) return (
    <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem" }}>
      <div style={{ fontFamily: "var(--font-display)", color: "#3d5a80", fontWeight: "700", fontSize: "1rem", marginBottom: "1rem" }}>
        {staff.find(s => s.id === editing.id) ? "スタッフを編集" : "新規スタッフ"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0.75rem", background: editing.color + "33", borderRadius: "8px", marginBottom: "1rem" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: editing.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "700", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)", flexShrink: 0 }}>
          {editing.name ? editing.name.slice(0, 1) : "?"}
        </div>
        <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{editing.name || "スタッフ名"}</div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>スタッフ名</label>
        <input style={inp} value={editing.name} onChange={e => setEdit("name", e.target.value)} placeholder="例: 山田 四郎" />
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={lbl}>表示色</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {STAFF_COLORS.map(c => (
            <div key={c} onClick={() => setEdit("color", c)}
              style={{ width: "30px", height: "30px", borderRadius: "50%", background: c, cursor: "pointer", border: editing.color === c ? "3px solid #4a8fd4" : "2px solid rgba(0,0,0,0.08)" }} />
          ))}
          <input type="color" value={editing.color} onChange={e => setEdit("color", e.target.value)}
            style={{ width: "30px", height: "30px", padding: "1px", border: "1px solid #dde3ec", borderRadius: "50%", cursor: "pointer" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={() => setEditing(null)}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={() => saveStaff(editing)} disabled={saving}>{saving ? "保存中…" : "保存する"}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ color: "#3d5a80", fontFamily: "var(--font-display)", fontWeight: "700" }}>スタッフ一覧</div>
        <button style={mkBtn("primary")} onClick={() => setEditing(emptyStaff())}>＋ 追加</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {staff.map(s => (
          <div key={s.id} style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: s.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "700", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
              {s.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "0.92rem" }}>{s.name}</div>
            </div>
            <button style={{ ...mkBtn("ghost"), padding: "0.4rem 0.75rem", fontSize: "0.82rem" }} onClick={() => setEditing({ ...s })}>編集</button>
            <button style={{ ...mkBtn("danger"), padding: "0.4rem 0.75rem", fontSize: "0.82rem" }} onClick={() => deleteStaff(s.id)}>削除</button>
          </div>
        ))}
        {staff.length === 0 && <div style={{ color: "#a0aec0", textAlign: "center", padding: "2rem", fontSize: "0.85rem" }}>スタッフがいません</div>}
      </div>
    </div>
  );
}

// ============================================================
// CHANGE PASSWORD
// ============================================================
function ChangePassword({ onClose }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [msg, setMsg] = useState(""); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (pw !== pw2) return setMsg("パスワードが一致しません");
    if (pw.length < 4) return setMsg("4文字以上で入力してください");
    setSaving(true);
    try { await apiFetch("/api/change-password", { method: "POST", body: { newPassword: pw } }); setMsg("✅ 変更しました"); setTimeout(onClose, 1200); }
    catch (e) { setMsg(e.message); } finally { setSaving(false); }
  };
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}><label style={lbl}>新しいパスワード</label><input type="password" style={inp} value={pw} onChange={e => setPw(e.target.value)} /></div>
      <div style={{ marginBottom: "1rem" }}><label style={lbl}>確認（もう一度）</label><input type="password" style={inp} value={pw2} onChange={e => setPw2(e.target.value)} /></div>
      {msg && <div style={{ fontSize: "0.83rem", color: msg.startsWith("✅") ? "#6bbf8f" : "#f87171", marginBottom: "0.75rem" }}>{msg}</div>}
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={onClose}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>変更する</button>
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
const TABS = [
  { id: "calendar", label: "予約", icon: "📅" },
  { id: "customers", label: "顧客", icon: "👤" },
  { id: "sales", label: "売上", icon: "💰" },
  { id: "menus", label: "メニュー", icon: "✂" },
  { id: "staffs", label: "スタッフ", icon: "👥" },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [tab, setTab] = useState("calendar");
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, s, st] = await Promise.all([
        apiFetch("/api/bookings"),
        apiFetch("/api/customers"),
        apiFetch("/api/services"),
        apiFetch("/api/staff"),
      ]);
      setBookings(b || []); setCustomers(c || []); setServices(s || []); setStaff(st || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  const todayCount = bookings.filter(b => b.date === fmt(today) && b.status !== "cancelled").length;

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const currentTab = TABS.find(t => t.id === tab);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600&display=swap');
        :root { --font-display: 'Shippori Mincho', serif; --font-body: 'Noto Sans JP', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f7fb; color: #2d3748; font-family: var(--font-body); -webkit-text-size-adjust: 100%; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f0f4f8; }
        ::-webkit-scrollbar-thumb { background: #c8d4e3; border-radius: 3px; }
        input, select, textarea { font-family: var(--font-body); font-size: 16px; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=month]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f7fb", paddingBottom: "70px" }}>
        {/* Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid #e4eaf4", padding: "0 1rem", display: "flex", alignItems: "center", height: "52px", gap: "0.75rem", boxShadow: "0 1px 6px rgba(80,100,140,0.07)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "#3d5a80", fontWeight: "700", whiteSpace: "nowrap" }}>✂ 理容管理</div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.6rem", color: "#a0aec0", fontWeight: "600" }}>本日</div>
            <div style={{ fontFamily: "var(--font-display)", color: "#4a8fd4", fontSize: "0.95rem", fontWeight: "700" }}>{todayCount}件</div>
          </div>
          <button onClick={() => setShowMenu(v => !v)}
            style={{ background: "#f0f4f8", border: "none", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ⚙️
          </button>
        </header>

        {/* Settings dropdown */}
        {showMenu && (
          <div style={{ position: "fixed", top: "52px", right: "0.75rem", background: "#fff", border: "1px solid #e4eaf4", borderRadius: "12px", boxShadow: "0 8px 24px rgba(80,100,140,0.15)", zIndex: 200, minWidth: "160px", overflow: "hidden" }}>
            <button onClick={() => { setShowChangePw(true); setShowMenu(false); }}
              style={{ display: "block", width: "100%", padding: "0.85rem 1.25rem", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.9rem", color: "#2d3748", borderBottom: "1px solid #f0f4f8" }}>🔑 PW変更</button>
            <button onClick={() => { clearToken(); setLoggedIn(false); }}
              style={{ display: "block", width: "100%", padding: "0.85rem 1.25rem", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.9rem", color: "#f87171" }}>ログアウト</button>
          </div>
        )}
        {showMenu && <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setShowMenu(false)} />}

        {/* Main content */}
        <main style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "#8896aa" }}>読み込み中…</div>
          ) : (
            <>
              {tab === "calendar" && <CalendarTab bookings={bookings} setBookings={setBookings} customers={customers} services={services} staff={staff} />}
              {tab === "customers" && <CustomersTab customers={customers} setCustomers={setCustomers} bookings={bookings} services={services} />}
              {tab === "sales" && <SalesTab bookings={bookings} services={services} staff={staff} customers={customers} />}
              {tab === "menus" && <MenuManagementTab services={services} setServices={setServices} />}
              {tab === "staffs" && <StaffManagementTab staff={staff} setStaff={setStaff} />}
            </>
          )}
        </main>
      </div>

      {/* Bottom navigation */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e4eaf4", display: "flex", zIndex: 100, boxShadow: "0 -2px 12px rgba(80,100,140,0.08)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "0.5rem 0.25rem 0.6rem", background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            color: tab === t.id ? "#4a8fd4" : "#a0aec0",
          }}>
            <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: "0.62rem", fontWeight: tab === t.id ? "700" : "500" }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {showChangePw && (
        <Modal title="🔑 パスワード変更" onClose={() => setShowChangePw(false)}>
          <ChangePassword onClose={() => setShowChangePw(false)} />
        </Modal>
      )}
    </>
  );
}
