import { useState, useEffect, useCallback } from "react";

// ============================================================
// API LAYER — RailwayのURLに変更してください
// ============================================================
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
  if (res.status === 401) {
    clearToken();
    window.location.reload();
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "エラーが発生しました");
  return data;
}

// ============================================================
// CONSTANTS
// ============================================================
const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 9).padStart(2, "0")}:00`);

function genId() { return "id_" + Math.random().toString(36).slice(2, 9); }

// ============================================================
// SHARED STYLES
// ============================================================
const inp = {
  background: "#fff", border: "1px solid #dde3ec", color: "#2d3748",
  padding: "0.55rem 0.75rem", borderRadius: "8px", width: "100%",
  fontSize: "0.88rem", boxSizing: "border-box", outline: "none",
};
const lbl = {
  display: "block", color: "#8896aa", fontSize: "0.72rem",
  marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600",
};
const mkBtn = (variant = "primary") => ({
  padding: "0.55rem 1.3rem", borderRadius: "8px", cursor: "pointer",
  fontSize: "0.88rem", fontWeight: "600", border: "none",
  background: variant === "primary" ? "#6b9fd4" : variant === "danger" ? "#f87171" : "#f0f4f8",
  color: variant === "primary" ? "#fff" : variant === "danger" ? "#fff" : "#4a5568",
});

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await data.json();
      if (!data.ok) throw new Error(json.error);
      setToken(json.token);
      onLogin();
    } catch (e) {
      setError(e.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "360px", boxShadow: "0 8px 32px rgba(80,100,140,0.12)", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✂</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#3d5a80", marginBottom: "0.3rem" }}>理容管理システム</h1>
        <p style={{ color: "#8896aa", fontSize: "0.83rem", marginBottom: "2rem" }}>パスワードを入力してください</p>
        <input
          type="password"
          style={{ ...inp, textAlign: "center", fontSize: "1rem", letterSpacing: "0.15em", marginBottom: "1rem" }}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          autoFocus
        />
        {error && <div style={{ color: "#f87171", fontSize: "0.83rem", marginBottom: "0.75rem" }}>{error}</div>}
        <button
          style={{ ...mkBtn("primary"), width: "100%", padding: "0.7rem", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "確認中…" : "ログイン"}
        </button>
        <p style={{ color: "#b0bec5", fontSize: "0.72rem", marginTop: "1.5rem" }}>
          初期パスワード: barber1234
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(60,80,100,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "100%", maxWidth: wide ? "680px" : "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(80,100,140,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid #eef1f6" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", color: "#3d5a80", fontWeight: "700" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aab4c0", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
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

  const handleService = (sid) => {
    const sv = services.find(s => s.id === sid);
    set("serviceId", sid);
    if (sv) set("price", sv.price);
  };
  const handleCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    set("customerId", cid);
    set("customerName", c ? c.name : "");
  };

  const selectedSv = services.find(s => s.id === form.serviceId);

  return (
    <div>
      {selectedSv && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.6rem 0.9rem", background: selectedSv.color + "88", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.83rem" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: selectedSv.color, border: "1px solid #ccc", flexShrink: 0 }} />
          {selectedSv.name}　{selectedSv.duration}分　¥{selectedSv.price.toLocaleString()}
        </div>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>顧客</label>
        <select style={inp} value={form.customerId} onChange={e => handleCustomer(e.target.value)}>
          <option value="">-- 顧客を選択 --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {!form.customerId && (
          <input style={{ ...inp, marginTop: "0.4rem" }} placeholder="または氏名を直接入力"
            value={form.customerName} onChange={e => set("customerName", e.target.value)} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
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
          <label style={lbl}>枠番号</label>
          <select style={inp} value={form.slot} onChange={e => set("slot", parseInt(e.target.value))}>
            <option value={0}>枠①</option>
            <option value={1}>枠②</option>
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
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button style={mkBtn("ghost")} onClick={onClose}>キャンセル</button>
        <button style={mkBtn("primary")} onClick={() => onSave(form)}>保存する</button>
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
      background: bg, borderRadius: "6px", padding: "3px 7px",
      cursor: "pointer", fontSize: "0.72rem", lineHeight: "1.45",
      border: `1px solid ${bg}`, flex: 1, minWidth: 0, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    }}>
      <div style={{ fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#2d3748" }}>{booking.customerName || "—"}</div>
      <div style={{ color: "#5a6a7e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sv?.name}</div>
    </div>
  );
}

// ============================================================
// CALENDAR TAB
// ============================================================
function CalendarTab({ bookings, setBookings, customers, services, staff }) {
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [view, setView] = useState("week");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const weekStart = (() => { const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay()); return d; })();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const bookingsOn = (dateStr) => bookings.filter(b => b.date === dateStr && b.status !== "cancelled");

  const saveBooking = async (b) => {
    setSaving(true);
    try {
      await apiFetch("/api/bookings", { method: "POST", body: b });
      setBookings(prev => {
        const exists = prev.find(x => x.id === b.id);
        return exists ? prev.map(x => x.id === b.id ? b : x) : [...prev, b];
      });
      setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteBooking = async (id) => {
    if (!confirm("この予約を削除しますか？")) return;
    try {
      await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
      setBookings(prev => prev.filter(x => x.id !== id));
      setModal(null);
    } catch (e) { alert(e.message); }
  };

  const NavBtn = ({ children, onClick }) => (
    <button onClick={onClick} style={{ background: "#f0f4f8", border: "none", color: "#4a5568", borderRadius: "8px", padding: "0.35rem 0.8rem", cursor: "pointer", fontSize: "0.9rem" }}>{children}</button>
  );
  const TabBtn = ({ active, children, onClick }) => (
    <button onClick={onClick} style={{ padding: "0.38rem 1rem", background: active ? "#6b9fd4" : "#f0f4f8", color: active ? "#fff" : "#6b7c93", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "600" }}>{children}</button>
  );
  const EmptySlot = ({ onClick }) => (
    <div onClick={onClick} style={{ flex: 1, borderRadius: "5px", border: "1.5px dashed #d0dae8", cursor: "pointer", minHeight: "38px" }} />
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <TabBtn active={view === "week"} onClick={() => setView("week")}>週</TabBtn>
          <TabBtn active={view === "day"}  onClick={() => setView("day")}>日</TabBtn>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <NavBtn onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - (view === "week" ? 7 : 1)); setCurrentDate(d); }}>‹</NavBtn>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.98rem", minWidth: "130px", textAlign: "center", color: "#3d5a80", fontWeight: "700" }}>
            {view === "week" ? `${weekStart.getFullYear()}年 ${weekStart.getMonth() + 1}月` : `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日`}
          </span>
          <NavBtn onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + (view === "week" ? 7 : 1)); setCurrentDate(d); }}>›</NavBtn>
          <button onClick={() => setCurrentDate(new Date(today))} style={{ padding: "0.35rem 0.9rem", background: "none", border: "1px solid #c8d4e3", color: "#6b7c93", borderRadius: "7px", cursor: "pointer", fontSize: "0.78rem" }}>今日</button>
        </div>
        <button onClick={() => setModal({ booking: null })} style={{ ...mkBtn("primary"), marginLeft: "auto" }}>＋ 予約追加</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.9rem", padding: "0.65rem 1rem", background: "#fff", borderRadius: "10px", border: "1px solid #e4eaf4" }}>
        {services.map(sv => (
          <div key={sv.id} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.73rem", color: "#5a6a7e" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: sv.color, border: "1px solid rgba(0,0,0,0.08)" }} />
            {sv.name}
          </div>
        ))}
      </div>

      {view === "week" && (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e4eaf4", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", minWidth: "660px" }}>
            <div style={{ borderBottom: "2px solid #e4eaf4", background: "#f8fafd" }} />
            {days.map(d => {
              const isToday = fmt(d) === fmt(today);
              return (
                <div key={fmt(d)} onClick={() => { setCurrentDate(d); setView("day"); }}
                  style={{ textAlign: "center", padding: "0.6rem 0.3rem", borderBottom: "2px solid #e4eaf4", borderLeft: "1px solid #e4eaf4", cursor: "pointer", background: isToday ? "#eef5ff" : "#f8fafd" }}>
                  <div style={{ fontSize: "0.65rem", color: "#8896aa", textTransform: "uppercase", fontWeight: "600" }}>{WEEKDAYS[d.getDay()]}</div>
                  <div style={{ fontSize: "1.15rem", fontFamily: "var(--font-display)", color: isToday ? "#4a8fd4" : "#3d5a80", fontWeight: isToday ? "700" : "400" }}>{d.getDate()}</div>
                  <div style={{ fontSize: "0.65rem", color: "#a0aec0" }}>{bookingsOn(fmt(d)).length}件</div>
                </div>
              );
            })}
            {HOURS.map(h => (
              <div key={h} style={{ display: "contents" }}>
                <div style={{ padding: "0.4rem 0.5rem 0 0", textAlign: "right", color: "#b0bec8", fontSize: "0.68rem", borderBottom: "1px solid #f0f4f8", background: "#fafbfe" }}>{h}</div>
                {days.map(d => {
                  const allSlots = bookingsOn(fmt(d)).filter(b => b.time === h);
                  const slot0 = allSlots.find(b => (b.slot ?? 0) === 0);
                  const slot1 = allSlots.find(b => b.slot === 1);
                  return (
                    <div key={fmt(d) + h} style={{ borderLeft: "1px solid #e4eaf4", borderBottom: "1px solid #f0f4f8", minHeight: "52px", padding: "3px", background: fmt(d) === fmt(today) ? "#fafcff" : "#fff", display: "flex", gap: "3px" }}>
                      {slot0 ? <BookingChip booking={slot0} services={services} onClick={() => setModal({ booking: slot0 })} /> : <EmptySlot onClick={() => setModal({ booking: null, prefill: { date: fmt(d), time: h, slot: 0 } })} />}
                      {slot1 ? <BookingChip booking={slot1} services={services} onClick={() => setModal({ booking: slot1 })} /> : <EmptySlot onClick={() => setModal({ booking: null, prefill: { date: fmt(d), time: h, slot: 1 } })} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "day" && (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e4eaf4", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: `52px repeat(${staff.length}, 1fr)`, minWidth: "480px" }}>
            <div style={{ borderBottom: "2px solid #e4eaf4", background: "#f8fafd" }} />
            {staff.map(s => (
              <div key={s.id} style={{ textAlign: "center", padding: "0.65rem 0.3rem", borderBottom: "2px solid #e4eaf4", borderLeft: "1px solid #e4eaf4", background: "#f8fafd" }}>
                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: s.color, marginRight: "5px", verticalAlign: "middle" }} />
                <span style={{ fontSize: "0.82rem", color: "#3d5a80", fontWeight: "600" }}>{s.name}</span>
              </div>
            ))}
            {HOURS.map(h => (
              <div key={h} style={{ display: "contents" }}>
                <div style={{ padding: "0.4rem 0.5rem 0 0", textAlign: "right", color: "#b0bec8", fontSize: "0.68rem", borderBottom: "1px solid #f0f4f8", background: "#fafbfe" }}>{h}</div>
                {staff.map(s => {
                  const allSlots = bookingsOn(fmt(currentDate)).filter(b => b.time === h && b.staffId === s.id);
                  const slot0 = allSlots.find(b => (b.slot ?? 0) === 0);
                  const slot1 = allSlots.find(b => b.slot === 1);
                  return (
                    <div key={s.id + h} style={{ borderLeft: "1px solid #e4eaf4", borderBottom: "1px solid #f0f4f8", minHeight: "60px", padding: "3px", display: "flex", gap: "3px" }}>
                      {slot0 ? <BookingChip booking={slot0} services={services} onClick={() => setModal({ booking: slot0 })} />
                              : <EmptySlot onClick={() => setModal({ booking: null, prefill: { staffId: s.id, date: fmt(currentDate), time: h, slot: 0 } })} />}
                      {slot1 ? <BookingChip booking={slot1} services={services} onClick={() => setModal({ booking: slot1 })} />
                              : <EmptySlot onClick={() => setModal({ booking: null, prefill: { staffId: s.id, date: fmt(currentDate), time: h, slot: 1 } })} />}
                    </div>
                  );
                })}
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
// SERVICE COLOR SETTINGS
// ============================================================
const COLOR_PRESETS = [
  "#fde8b0","#c8e6fb","#ffd6d6","#e8d5f5","#d5f0e8","#ffe5c8",
  "#d5eaf5","#f5d5e8","#e8f5d5","#f5e8d5","#dff5f5","#f5dfd5",
];

function ServiceSettings({ services, setServices, onClose }) {
  const [local, setLocal] = useState(services.map(s => ({ ...s })));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/services", { method: "POST", body: local });
      setServices(local);
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p style={{ fontSize: "0.83rem", color: "#8896aa", marginBottom: "1.25rem" }}>メニューごとにカレンダー上の表示色を設定できます。</p>
      {local.map((sv, i) => (
        <div key={sv.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem", padding: "0.75rem 1rem", background: "#f8fafd", borderRadius: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: sv.color, flexShrink: 0, border: "1px solid #dde3ec" }} />
          <div style={{ flex: 1, fontWeight: "600", fontSize: "0.88rem", color: "#2d3748" }}>{sv.name}</div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            {COLOR_PRESETS.map(c => (
              <div key={c} onClick={() => setLocal(l => l.map((x, j) => j === i ? { ...x, color: c } : x))}
                style={{ width: "20px", height: "20px", borderRadius: "5px", background: c, cursor: "pointer",
                  border: sv.color === c ? "2.5px solid #4a8fd4" : "1px solid #dde3ec" }} />
            ))}
            <input type="color" value={sv.color}
              onChange={e => setLocal(l => l.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
              style={{ width: "26px", height: "26px", padding: "1px", border: "1px solid #dde3ec", borderRadius: "5px", cursor: "pointer" }} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.75rem" }}>
        <button style={mkBtn("ghost")} onClick={onClose}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? "保存中…" : "保存する"}</button>
      </div>
    </div>
  );
}

// ============================================================
// PASSWORD CHANGE
// ============================================================
function ChangePassword({ onClose }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pw !== pw2) return setMsg("パスワードが一致しません");
    if (pw.length < 4) return setMsg("4文字以上で入力してください");
    setSaving(true);
    try {
      await apiFetch("/api/change-password", { method: "POST", body: { newPassword: pw } });
      setMsg("✅ パスワードを変更しました");
      setTimeout(onClose, 1200);
    } catch (e) { setMsg(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>新しいパスワード</label>
        <input type="password" style={inp} value={pw} onChange={e => setPw(e.target.value)} />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label style={lbl}>確認（もう一度入力）</label>
        <input type="password" style={inp} value={pw2} onChange={e => setPw2(e.target.value)} />
      </div>
      {msg && <div style={{ fontSize: "0.83rem", color: msg.startsWith("✅") ? "#6bbf8f" : "#f87171", marginBottom: "0.75rem" }}>{msg}</div>}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button style={mkBtn("ghost")} onClick={onClose}>キャンセル</button>
        <button style={{ ...mkBtn("primary"), opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>変更する</button>
      </div>
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
    if (!confirm("顧客を削除しますか？")) return;
    try {
      await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      setCustomers(prev => prev.filter(x => x.id !== id));
      setSelected(null);
    } catch (e) { alert(e.message); }
  };

  const customerBookings = selected
    ? bookings.filter(b => b.customerId === selected.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", minHeight: "580px" }}>
      <div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input placeholder="🔍 顧客を検索…" style={{ ...inp, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} />
          <button style={mkBtn("primary")} onClick={() => { setEditing({ id: genId(), name: "", phone: "", email: "", notes: "", visits: 0, lastVisit: "", totalSpent: 0 }); setSelected(null); }}>＋</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setEditing(null); }}
              style={{ padding: "0.7rem 0.9rem", background: selected?.id === c.id ? "#eef5ff" : "#fff", border: `1.5px solid ${selected?.id === c.id ? "#6b9fd4" : "#e4eaf4"}`, borderRadius: "10px", cursor: "pointer" }}>
              <div style={{ fontWeight: "600", fontSize: "0.88rem", color: "#2d3748" }}>{c.name}</div>
              <div style={{ color: "#8896aa", fontSize: "0.75rem" }}>{c.phone || "—"} · 来店 {c.visits}回</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: "#a0aec0", textAlign: "center", padding: "2rem", fontSize: "0.85rem" }}>該当する顧客がいません</div>}
        </div>
      </div>
      <div>
        {editing && (
          <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-display)", color: "#3d5a80", marginBottom: "1.25rem", fontSize: "1rem" }}>{editing.name ? "顧客情報の編集" : "新規顧客"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
              {[["name","氏名"],["phone","電話番号"],["email","メールアドレス"]].map(([k, l]) => (
                <div key={k} style={{ gridColumn: k === "email" ? "1 / -1" : "auto" }}>
                  <label style={lbl}>{l}</label>
                  <input style={inp} value={editing[k]} onChange={e => setEditing(x => ({ ...x, [k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>メモ</label>
                <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }} value={editing.notes} onChange={e => setEditing(x => ({ ...x, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button style={mkBtn("ghost")} onClick={() => setEditing(null)}>キャンセル</button>
              <button style={{ ...mkBtn("primary"), opacity: saving ? 0.7 : 1 }} onClick={() => saveCustomer(editing)} disabled={saving}>{saving ? "保存中…" : "保存する"}</button>
            </div>
          </div>
        )}
        {selected && !editing && (
          <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", color: "#3d5a80", margin: 0 }}>{selected.name}</h2>
                <div style={{ color: "#8896aa", fontSize: "0.83rem", marginTop: "0.2rem" }}>{selected.phone}{selected.email && ` · ${selected.email}`}</div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button style={mkBtn("ghost")} onClick={() => setEditing(selected)}>編集</button>
                <button style={mkBtn("danger")} onClick={() => deleteCustomer(selected.id)}>削除</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[["来店回数",`${selected.visits}回`],["最終来店",selected.lastVisit||"—"],["累計金額",`¥${(selected.totalSpent||0).toLocaleString()}`]].map(([k,v]) => (
                <div key={k} style={{ background: "#f4f8ff", border: "1px solid #e4eaf4", borderRadius: "10px", padding: "0.9rem", textAlign: "center" }}>
                  <div style={{ color: "#8896aa", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>{k}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#4a8fd4", marginTop: "0.2rem" }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div style={{ background: "#fffbf0", border: "1px solid #f0e6c8", borderRadius: "8px", padding: "0.7rem 1rem", marginBottom: "1.25rem", fontSize: "0.83rem", color: "#5a4a2a" }}>
                📝 {selected.notes}
              </div>
            )}
            <div>
              <div style={{ color: "#8896aa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "0.6rem" }}>来店履歴</div>
              {customerBookings.length === 0
                ? <div style={{ color: "#a0aec0", fontSize: "0.83rem" }}>記録なし</div>
                : customerBookings.map(b => {
                  const sv = services.find(s => s.id === b.serviceId);
                  return (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f4f8", fontSize: "0.83rem", alignItems: "center" }}>
                      <span style={{ color: "#8896aa" }}>{b.date}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {sv && <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: sv.color }} />}
                        {sv?.name || "—"}
                      </span>
                      <span style={{ color: "#4a8fd4", fontWeight: "600" }}>¥{b.price.toLocaleString()}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {!selected && !editing && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#b0bec5", fontSize: "0.88rem", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "2.5rem" }}>👤</span>顧客を選択してください
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SALES TAB
// ============================================================
function SalesTab({ bookings, services, staff }) {
  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
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

  const Bar = ({ label, value, max, color, height = "28px" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.6rem" }}>
      <div style={{ width: "108px", fontSize: "0.78rem", color: "#6b7c93", textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ flex: 1, background: "#eef1f7", borderRadius: "6px", height, overflow: "hidden" }}>
        <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color || "#6b9fd4", borderRadius: "6px", transition: "width 0.5s ease", minWidth: value > 0 ? "4px" : "0" }} />
      </div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "0.78rem", color: "#2d3748", fontWeight: "600", flexShrink: 0 }}>¥{value.toLocaleString()}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[["今月売上",`¥${totalThisMonth.toLocaleString()}`,"#4a8fd4"],["予約件数",`${bookingsThisMonth}件`,"#3d5a80"],["客単価",`¥${bookingsThisMonth > 0 ? Math.round(totalThisMonth / bookingsThisMonth).toLocaleString() : 0}`,"#6bbf8f"]].map(([k,v,c]) => (
          <div key={k} style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.2rem 1.5rem" }}>
            <div style={{ color: "#8896aa", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: "600" }}>{k}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.65rem", color: c, marginTop: "0.3rem" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inp, width: "auto", background: "#fff" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ color: "#8896aa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "1rem" }}>月次売上推移</div>
          {monthKeys.length === 0 ? <div style={{ color: "#a0aec0", fontSize: "0.83rem" }}>データなし</div> : monthKeys.map(m => <Bar key={m} label={m} value={monthly[m]} max={maxMonthly} color="#6b9fd4" />)}
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ color: "#8896aa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "1rem" }}>スタッフ別売上（今月）</div>
          {staff.map(s => <Bar key={s.id} label={s.name} value={staffRev[s.id] || 0} max={Math.max(...staff.map(x => staffRev[x.id] || 0), 1)} color={s.color} />)}
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.25rem", gridColumn: "1 / -1" }}>
          <div style={{ color: "#8896aa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "1rem" }}>メニュー別売上（今月）</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
            {services.map(sv => <Bar key={sv.id} label={sv.name} value={svRev[sv.id] || 0} max={Math.max(...services.map(s => svRev[s.id] || 0), 1)} color={sv.color} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MENU MANAGEMENT TAB
// ============================================================
const COLOR_PRESETS2 = [
  "#fde8b0","#c8e6fb","#ffd6d6","#e8d5f5","#d5f0e8","#ffe5c8",
  "#d5eaf5","#f5d5e8","#e8f5d5","#f5e8d5","#dff5f5","#f5dfd5",
];

function MenuManagementTab({ services, setServices }) {
  const [editing, setEditing] = useState(null); // null | service object
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const emptyService = () => ({
    id: "sv_" + Math.random().toString(36).slice(2, 9),
    name: "", duration: 30, price: 0, color: "#fde8b0",
  });

  const saveService = async (sv) => {
    if (!sv.name.trim()) return alert("メニュー名を入力してください");
    setSaving(true);
    try {
      // 既存リストにマージして全件送信
      const updated = services.find(s => s.id === sv.id)
        ? services.map(s => s.id === sv.id ? sv : s)
        : [...services, sv];
      await apiFetch("/api/services", { method: "POST", body: updated });
      setServices(updated);
      setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteService = async (id) => {
    if (!confirm("このメニューを削除しますか？\n※このメニューが設定された既存の予約には影響しません")) return;
    setDeleting(id);
    try {
      const updated = services.filter(s => s.id !== id);
      await apiFetch("/api/services", { method: "POST", body: updated });
      setServices(updated);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const setEdit = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "1.5rem", alignItems: "start" }}>
      {/* List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ color: "#3d5a80", fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: "700" }}>メニュー一覧</div>
          <button style={mkBtn("primary")} onClick={() => setEditing(emptyService())}>＋ メニュー追加</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {services.map(sv => (
            <div key={sv.id} style={{ background: "#fff", border: `1.5px solid ${editing?.id === sv.id ? "#6b9fd4" : "#e4eaf4"}`, borderRadius: "12px", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: sv.color, flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#2d3748" }}>{sv.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#8896aa", marginTop: "2px" }}>
                  {sv.duration}分 ／ ¥{sv.price.toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button style={mkBtn("ghost")} onClick={() => setEditing({ ...sv })}>編集</button>
                <button
                  style={{ ...mkBtn("danger"), opacity: deleting === sv.id ? 0.6 : 1 }}
                  onClick={() => deleteService(sv.id)}
                  disabled={deleting === sv.id}
                >削除</button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div style={{ color: "#a0aec0", textAlign: "center", padding: "3rem", fontSize: "0.88rem" }}>
              メニューがありません。追加してください。
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div>
        {editing ? (
          <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.5rem", position: "sticky", top: "1.5rem" }}>
            <div style={{ fontFamily: "var(--font-display)", color: "#3d5a80", fontWeight: "700", fontSize: "1rem", marginBottom: "1.25rem" }}>
              {services.find(s => s.id === editing.id) ? "メニューを編集" : "新規メニュー"}
            </div>

            {/* Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.75rem 1rem", background: editing.color + "55", borderRadius: "8px", marginBottom: "1.25rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: editing.color, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#2d3748" }}>{editing.name || "メニュー名"}</div>
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
                <input type="number" style={inp} value={editing.duration} min={5} step={5}
                  onChange={e => setEdit("duration", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label style={lbl}>料金（¥）</label>
                <input type="number" style={inp} value={editing.price} min={0}
                  onChange={e => setEdit("price", parseInt(e.target.value) || 0)} />
              </div>
            </div>

            {/* Color */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>カレンダーの表示色</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.5rem" }}>
                {COLOR_PRESETS2.map(c => (
                  <div key={c} onClick={() => setEdit("color", c)}
                    style={{ width: "24px", height: "24px", borderRadius: "6px", background: c, cursor: "pointer",
                      border: editing.color === c ? "2.5px solid #4a8fd4" : "1px solid #dde3ec",
                      transform: editing.color === c ? "scale(1.2)" : "scale(1)", transition: "all 0.1s" }} />
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="color" value={editing.color} onChange={e => setEdit("color", e.target.value)}
                    style={{ width: "28px", height: "28px", padding: "1px", border: "1px solid #dde3ec", borderRadius: "6px", cursor: "pointer" }} title="カスタムカラー" />
                  <span style={{ fontSize: "0.72rem", color: "#8896aa" }}>カスタム</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={() => setEditing(null)}>キャンセル</button>
              <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }}
                onClick={() => saveService(editing)} disabled={saving}>
                {saving ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#f8fafd", border: "1.5px dashed #c8d4e3", borderRadius: "12px", padding: "2rem", textAlign: "center", color: "#a0aec0", fontSize: "0.88rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✂</div>
            左のメニューを選んで編集するか<br />「＋ メニュー追加」で新規作成
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// STAFF MANAGEMENT TAB
// ============================================================
const STAFF_COLORS = [
  "#f0a8a8","#a8c8f0","#b8e0c8","#f5d5a8","#d5a8f5","#a8f5d5",
  "#f5a8d5","#d5f5a8","#a8d5f5","#f5f5a8","#c8b8f0","#f0c8b8",
];

function StaffManagementTab({ staff, setStaff }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const emptyStaff = () => ({
    id: "st_" + Math.random().toString(36).slice(2, 9),
    name: "", color: "#a8c8f0", sortOrder: staff.length,
  });

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
    if (!confirm("このスタッフを削除しますか？\n※このスタッフが担当する既存の予約には影響しません")) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
      setStaff(prev => prev.filter(s => s.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const setEdit = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
      {/* List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ color: "#3d5a80", fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: "700" }}>スタッフ一覧</div>
          <button style={mkBtn("primary")} onClick={() => setEditing(emptyStaff())}>＋ スタッフ追加</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {staff.map((s, i) => (
            <div key={s.id} style={{ background: "#fff", border: `1.5px solid ${editing?.id === s.id ? "#6b9fd4" : "#e4eaf4"}`, borderRadius: "12px", padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: s.color, flexShrink: 0, border: "2px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "700", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                {s.name.slice(0, 1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#2d3748" }}>{s.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#8896aa", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: s.color, border: "1px solid rgba(0,0,0,0.1)" }} />
                  カレンダー表示色
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button style={mkBtn("ghost")} onClick={() => setEditing({ ...s })}>編集</button>
                <button
                  style={{ ...mkBtn("danger"), opacity: deleting === s.id ? 0.6 : 1 }}
                  onClick={() => deleteStaff(s.id)}
                  disabled={deleting === s.id}
                >削除</button>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div style={{ color: "#a0aec0", textAlign: "center", padding: "3rem", fontSize: "0.88rem" }}>
              スタッフがいません。追加してください。
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div>
        {editing ? (
          <div style={{ background: "#fff", border: "1.5px solid #e4eaf4", borderRadius: "12px", padding: "1.5rem", position: "sticky", top: "1.5rem" }}>
            <div style={{ fontFamily: "var(--font-display)", color: "#3d5a80", fontWeight: "700", fontSize: "1rem", marginBottom: "1.25rem" }}>
              {staff.find(s => s.id === editing.id) ? "スタッフを編集" : "新規スタッフ"}
            </div>

            {/* Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0.75rem 1rem", background: editing.color + "33", borderRadius: "8px", marginBottom: "1.25rem" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: editing.color, border: "2px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "700", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                {editing.name ? editing.name.slice(0, 1) : "?"}
              </div>
              <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#2d3748" }}>{editing.name || "スタッフ名"}</div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={lbl}>スタッフ名</label>
              <input style={inp} value={editing.name} onChange={e => setEdit("name", e.target.value)} placeholder="例: 山田 四郎" />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={lbl}>カレンダーの表示色</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.5rem" }}>
                {STAFF_COLORS.map(c => (
                  <div key={c} onClick={() => setEdit("color", c)}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", background: c, cursor: "pointer",
                      border: editing.color === c ? "2.5px solid #4a8fd4" : "2px solid rgba(0,0,0,0.08)",
                      transform: editing.color === c ? "scale(1.2)" : "scale(1)", transition: "all 0.1s" }} />
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="color" value={editing.color} onChange={e => setEdit("color", e.target.value)}
                    style={{ width: "28px", height: "28px", padding: "1px", border: "1px solid #dde3ec", borderRadius: "50%", cursor: "pointer" }} title="カスタムカラー" />
                  <span style={{ fontSize: "0.72rem", color: "#8896aa" }}>カスタム</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button style={{ ...mkBtn("ghost"), flex: 1 }} onClick={() => setEditing(null)}>キャンセル</button>
              <button style={{ ...mkBtn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }}
                onClick={() => saveStaff(editing)} disabled={saving}>
                {saving ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#f8fafd", border: "1.5px dashed #c8d4e3", borderRadius: "12px", padding: "2rem", textAlign: "center", color: "#a0aec0", fontSize: "0.88rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👤</div>
            左のスタッフを選んで編集するか<br />「＋ スタッフ追加」で新規作成
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [tab, setTab] = useState("calendar");
  const [bookings,  setBookings]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services,  setServices]  = useState([]);
  const [staff,     setStaff]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showChangePw, setShowChangePw] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, s, st] = await Promise.all([
        apiFetch("/api/bookings"),
        apiFetch("/api/customers"),
        apiFetch("/api/services"),
        apiFetch("/api/staff"),
      ]);
      setBookings(b || []);
      setCustomers(c || []);
      setServices(s || []);
      setStaff(st || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  const todayCount = bookings.filter(b => b.date === fmt(today) && b.status !== "cancelled").length;

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const NavTab = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: "0.4rem 1.1rem", background: tab === id ? "#eef5ff" : "none",
      color: tab === id ? "#4a8fd4" : "#8896aa", border: "none", borderRadius: "8px",
      cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.88rem",
      fontWeight: tab === id ? "700" : "500",
    }}>{label}</button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600&display=swap');
        :root { --font-display: 'Shippori Mincho', serif; --font-body: 'Noto Sans JP', sans-serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f7fb; color: #2d3748; font-family: var(--font-body); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f4f8; }
        ::-webkit-scrollbar-thumb { background: #c8d4e3; border-radius: 3px; }
        input, select, textarea { font-family: var(--font-body); }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=month]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#f4f7fb" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e4eaf4", padding: "0 2rem", display: "flex", alignItems: "center", height: "58px", gap: "1.5rem", boxShadow: "0 1px 6px rgba(80,100,140,0.07)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#3d5a80", letterSpacing: "0.06em", whiteSpace: "nowrap", fontWeight: "700" }}>✂ 理容管理</div>
          <nav style={{ display: "flex", gap: "0.15rem", borderLeft: "1px solid #e4eaf4", paddingLeft: "1.25rem" }}>
            <NavTab id="calendar"  label="📅 予約カレンダー" />
            <NavTab id="customers" label="👤 顧客" />
            <NavTab id="sales"     label="💰 売上" />
            <NavTab id="menus"     label="✂ メニュー管理" />
            <NavTab id="staffs"    label="👤 スタッフ管理" />
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => setShowChangePw(true)} style={{ padding: "0.35rem 0.9rem", background: "#f4f7fb", border: "1px solid #dde3ec", color: "#6b7c93", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" }}>🔑 PW変更</button>
            <button onClick={() => { clearToken(); setLoggedIn(false); }} style={{ padding: "0.35rem 0.9rem", background: "#fff0f0", border: "1px solid #ffd0d0", color: "#f87171", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" }}>ログアウト</button>
            <div style={{ width: "1px", height: "28px", background: "#e4eaf4" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.64rem", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>本日の予約</div>
              <div style={{ fontFamily: "var(--font-display)", color: "#4a8fd4", fontSize: "1.05rem", fontWeight: "700" }}>{todayCount}件</div>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#8896aa" }}>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日（{WEEKDAYS[today.getDay()]}）
            </div>
          </div>
        </header>

        <main style={{ padding: "1.5rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#8896aa", fontSize: "0.9rem" }}>
              読み込み中…
            </div>
          ) : (
            <>
              {tab === "calendar"  && <CalendarTab  bookings={bookings} setBookings={setBookings} customers={customers} services={services} staff={staff} />}
              {tab === "customers" && <CustomersTab customers={customers} setCustomers={setCustomers} bookings={bookings} services={services} />}
              {tab === "sales"     && <SalesTab     bookings={bookings} services={services} staff={staff} />}
              {tab === "menus"     && <MenuManagementTab services={services} setServices={setServices} />}
              {tab === "staffs"    && <StaffManagementTab staff={staff} setStaff={setStaff} />}
            </>
          )}
        </main>
      </div>

      {showChangePw && (
        <Modal title="🔑 パスワード変更" onClose={() => setShowChangePw(false)}>
          <ChangePassword onClose={() => setShowChangePw(false)} />
        </Modal>
      )}
    </>
  );
}
