"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Bell, BookOpen, CalendarDays, Check,
  ChevronDown, CircleHelp, Clock3, CreditCard, Download, Edit3,
  ExternalLink, FileText, Filter, HelpCircle, LayoutDashboard,
  LogOut, Mail, Moon, MoreHorizontal, Phone, Plus, RefreshCw,
  Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles,
  Sun, Trash2, Users, Wifi, X
} from "lucide-react";

type Seat = { id: number; status: "available" | "occupied" | "reserved"; name?: string; zone: string };

type Student = {
  id: string;
  name: string;
  initials: string;
  color: string;
  seat: string;
  date: string;
  phone: string;
  email: string;
  payment: "Paid" | "Pending";
  amount: number;
  plan: "Full Day" | "Morning Slot" | "Evening Slot";
};

type PaymentRecord = {
  id: string;
  invoiceId: string;
  studentName: string;
  seat: string;
  amount: number;
  date: string;
  method: "UPI / GPay" | "Cash" | "Bank Transfer" | "Card";
  status: "Paid" | "Pending";
};

type RoomSettings = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  monthlyFee: number;
  deposit: number;
  lockerFee: number;
  wifiSSID: string;
  wifiPass: string;
  silenceRule: boolean;
};

const initialSeats: Seat[] = Array.from({ length: 32 }, (_, i) => {
  const occupied: Record<number, string> = {
    2: "Aarav Mehta", 3: "Diya Shah", 5: "Ishaan Rao", 8: "Meera Kapoor",
    9: "Rohan Patel", 13: "Anaya Joshi", 14: "Kabir Verma", 18: "Sana Ali",
    19: "Arjun Das", 22: "Nisha Tiwari", 26: "Vivaan Bose", 27: "Tara Nair"
  };
  const reserved = [6, 16, 30];
  return {
    id: i + 1,
    status: occupied[i + 1] ? "occupied" : reserved.includes(i + 1) ? "reserved" : "available",
    name: occupied[i + 1],
    zone: i < 16 ? "Quiet zone" : "Window side"
  };
});

const initialStudents: Student[] = [
  { id: "st-1", name: "Aarav Mehta", initials: "AM", color: "sage", seat: "A-02", date: "12 Oct 2024", phone: "+91 98201 43210", email: "aarav.m@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-2", name: "Diya Shah", initials: "DS", color: "peach", seat: "A-03", date: "08 Oct 2024", phone: "+91 97110 88231", email: "diya.s@yahoo.com", payment: "Pending", amount: 1200, plan: "Full Day" },
  { id: "st-3", name: "Ishaan Rao", initials: "IR", color: "lilac", seat: "A-05", date: "05 Oct 2024", phone: "+91 98450 12904", email: "ishaan.rao@outlook.com", payment: "Paid", amount: 1200, plan: "Morning Slot" },
  { id: "st-4", name: "Meera Kapoor", initials: "MK", color: "blue", seat: "A-08", date: "01 Oct 2024", phone: "+91 99203 77412", email: "meera.k@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-5", name: "Rohan Patel", initials: "RP", color: "yellow", seat: "A-09", date: "28 Sep 2024", phone: "+91 98190 22345", email: "rohan.p@gmail.com", payment: "Paid", amount: 1200, plan: "Evening Slot" },
  { id: "st-6", name: "Anaya Joshi", initials: "AJ", color: "sage", seat: "A-13", date: "22 Sep 2024", phone: "+91 98334 55102", email: "anaya.j@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-7", name: "Kabir Verma", initials: "KV", color: "peach", seat: "A-14", date: "18 Sep 2024", phone: "+91 98712 33490", email: "kabir.v@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-8", name: "Sana Ali", initials: "SA", color: "lilac", seat: "B-02", date: "15 Sep 2024", phone: "+91 99880 12399", email: "sana.ali@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-9", name: "Arjun Das", initials: "AD", color: "blue", seat: "B-03", date: "10 Sep 2024", phone: "+91 98210 66541", email: "arjun.das@gmail.com", payment: "Paid", amount: 1200, plan: "Morning Slot" },
  { id: "st-10", name: "Nisha Tiwari", initials: "NT", color: "yellow", seat: "B-06", date: "04 Sep 2024", phone: "+91 98111 90812", email: "nisha.t@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
  { id: "st-11", name: "Vivaan Bose", initials: "VB", color: "sage", seat: "B-10", date: "01 Sep 2024", phone: "+91 98300 44198", email: "vivaan.b@gmail.com", payment: "Paid", amount: 1200, plan: "Evening Slot" },
  { id: "st-12", name: "Tara Nair", initials: "TN", color: "peach", seat: "B-11", date: "25 Aug 2024", phone: "+91 98401 55673", email: "tara.nair@gmail.com", payment: "Paid", amount: 1200, plan: "Full Day" },
];

const initialPayments: PaymentRecord[] = [
  { id: "tx-1", invoiceId: "INV-2024-089", studentName: "Aarav Mehta", seat: "A-02", amount: 1200, date: "12 Oct 2024", method: "UPI / GPay", status: "Paid" },
  { id: "tx-2", invoiceId: "INV-2024-090", studentName: "Diya Shah", seat: "A-03", amount: 1200, date: "Due 08 Oct", method: "UPI / GPay", status: "Pending" },
  { id: "tx-3", invoiceId: "INV-2024-091", studentName: "Ishaan Rao", seat: "A-05", amount: 1200, date: "05 Oct 2024", method: "Cash", status: "Paid" },
  { id: "tx-4", invoiceId: "INV-2024-092", studentName: "Meera Kapoor", seat: "A-08", amount: 1200, date: "01 Oct 2024", method: "Card", status: "Paid" },
  { id: "tx-5", invoiceId: "INV-2024-093", studentName: "Rohan Patel", seat: "A-09", amount: 1200, date: "28 Sep 2024", method: "UPI / GPay", status: "Paid" },
  { id: "tx-6", invoiceId: "INV-2024-094", studentName: "Anaya Joshi", seat: "A-13", amount: 1200, date: "22 Sep 2024", method: "Bank Transfer", status: "Paid" },
  { id: "tx-7", invoiceId: "INV-2024-095", studentName: "Kabir Verma", seat: "A-14", amount: 1200, date: "18 Sep 2024", method: "UPI / GPay", status: "Paid" },
  { id: "tx-8", invoiceId: "INV-2024-096", studentName: "Sana Ali", seat: "B-02", amount: 1200, date: "15 Sep 2024", method: "UPI / GPay", status: "Paid" },
  { id: "tx-9", invoiceId: "INV-2024-097", studentName: "Arjun Das", seat: "B-03", amount: 1200, date: "10 Sep 2024", method: "Cash", status: "Paid" },
];

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [studentsList, setStudentsList] = useState<Student[]>(initialStudents);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>(initialPayments);
  const [active, setActive] = useState<string>("Overview");
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [toast, setToast] = useState<string>("");
  const [studentView, setStudentView] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<boolean>(false);
  const [inspectSeat, setInspectSeat] = useState<Seat | null>(null);
  const [viewReceipt, setViewReceipt] = useState<PaymentRecord | null>(null);

  // Form states
  const [newStudentName, setNewStudentName] = useState<string>("");
  const [newStudentEmail, setNewStudentEmail] = useState<string>("");
  const [newStudentPhone, setNewStudentPhone] = useState<string>("");
  const [newStudentSeat, setNewStudentSeat] = useState<string>("");
  const [newStudentPlan, setNewStudentPlan] = useState<"Full Day" | "Morning Slot" | "Evening Slot">("Full Day");

  // Record payment form
  const [paymentStudent, setPaymentStudent] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(1200);
  const [paymentMethod, setPaymentMethod] = useState<"UPI / GPay" | "Cash" | "Bank Transfer" | "Card">("UPI / GPay");

  // Settings state
  const [settings, setSettings] = useState<RoomSettings>({
    name: "Serenity Study Hall",
    tagline: "Reading Space & Dedicated Study Hall",
    address: "4th Floor, Apex Tower, Near Central Library, Ernakulam",
    phone: "+91 98470 11223",
    email: "contact@stillroom.space",
    openTime: "06:00 AM",
    closeTime: "11:00 PM",
    monthlyFee: 1200,
    deposit: 500,
    lockerFee: 200,
    wifiSSID: "Stillroom_HighSpeed_5G",
    wifiPass: "focusquiet2024",
    silenceRule: true,
  });

  // Filters
  const [studentQuery, setStudentQuery] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [seatFilter, setSeatFilter] = useState<"All" | "Available" | "Occupied" | "Reserved" | "Quiet" | "Window">("All");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) as "dark" | "light" | null;
    const initial = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
    }
    document.documentElement.setAttribute("data-theme", next);
    notify(`Switched to ${next === "dark" ? "Dark" : "Light"} mode`);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const availableCount = seats.filter((seat) => seat.status === "available").length;
  const occupiedCount = seats.filter((seat) => seat.status === "occupied").length;
  const reservedCount = seats.filter((seat) => seat.status === "reserved").length;

  const totalCollected = paymentsList.filter(p => p.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
  const pendingDuesTotal = studentsList.filter(s => s.payment === "Pending").reduce((acc, curr) => acc + curr.amount, 0);

  // Toggle student payment status
  const toggleStudentPayment = (id: string) => {
    setStudentsList(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.payment === "Paid" ? "Pending" : "Paid";
        notify(`Payment status for ${s.name} updated to ${nextStatus}`);
        return { ...s, payment: nextStatus };
      }
      return s;
    }));
  };

  // Add new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;

    let assignedSeatNumber: number | null = null;
    if (newStudentSeat) {
      assignedSeatNumber = parseInt(newStudentSeat, 10);
    } else {
      const firstAvail = seats.find(s => s.status === "available");
      if (firstAvail) assignedSeatNumber = firstAvail.id;
    }

    if (!assignedSeatNumber) {
      notify("No seats available right now!");
      return;
    }

    const seatCode = `${assignedSeatNumber <= 16 ? "A" : "B"}-${String((assignedSeatNumber - 1) % 16 + 1).padStart(2, "0")}`;
    const initials = newStudentName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const colors = ["sage", "peach", "lilac", "blue", "yellow"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newStudent: Student = {
      id: `st-${Date.now()}`,
      name: newStudentName,
      initials: initials || "ST",
      color: randomColor,
      seat: seatCode,
      date: "Today",
      phone: newStudentPhone || "+91 98000 00000",
      email: newStudentEmail || `${newStudentName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      payment: "Paid",
      amount: settings.monthlyFee,
      plan: newStudentPlan,
    };

    setStudentsList([newStudent, ...studentsList]);

    // Update seat to occupied
    setSeats(prev => prev.map(s => s.id === assignedSeatNumber ? { ...s, status: "occupied", name: newStudentName } : s));

    // Log payment
    const newTx: PaymentRecord = {
      id: `tx-${Date.now()}`,
      invoiceId: `INV-2024-${String(paymentsList.length + 90).padStart(3, "0")}`,
      studentName: newStudentName,
      seat: seatCode,
      amount: settings.monthlyFee,
      date: "Today",
      method: "UPI / GPay",
      status: "Paid"
    };
    setPaymentsList([newTx, ...paymentsList]);

    setNewStudentName("");
    setNewStudentEmail("");
    setNewStudentPhone("");
    setNewStudentSeat("");
    setShowAddStudentModal(false);
    notify(`Student ${newStudentName} registered and assigned Seat ${seatCode}!`);
  };

  // Record payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;

    const student = studentsList.find(s => s.name === paymentStudent);
    const newTx: PaymentRecord = {
      id: `tx-${Date.now()}`,
      invoiceId: `INV-2024-${String(paymentsList.length + 90).padStart(3, "0")}`,
      studentName: paymentStudent,
      seat: student?.seat || "General",
      amount: paymentAmount,
      date: "Today",
      method: paymentMethod,
      status: "Paid"
    };

    setPaymentsList([newTx, ...paymentsList]);
    if (student) {
      setStudentsList(prev => prev.map(s => s.name === paymentStudent ? { ...s, payment: "Paid" } : s));
    }
    setShowRecordPaymentModal(false);
    notify(`Payment of ₹${paymentAmount} recorded for ${paymentStudent}`);
  };

  // Vacate seat
  const handleVacateSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return;
    const seatName = seat.name;

    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: "available", name: undefined } : s));
    if (seatName) {
      setStudentsList(prev => prev.filter(s => s.name !== seatName));
    }
    setInspectSeat(null);
    notify(`Seat ${seatId <= 16 ? "A" : "B"}-${String((seatId - 1) % 16 + 1).padStart(2, "0")} is now open and available.`);
  };

  // Student portal booking
  const handleStudentPortalReserve = () => {
    if (!selectedSeat) return;
    setSeats(prev => prev.map(s => s.id === selectedSeat.id ? { ...s, status: "reserved" } : s));
    setSelectedSeat(null);
    setStudentView(false);
    notify("Booking request submitted! Admin will confirm shortly.");
  };

  if (studentView) {
    return (
      <StudentPortal
        seats={seats}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => setStudentView(false)}
        onSelect={(seat) => { setSelectedSeat(seat); setStudentView(false); }}
      />
    );
  }

  return (
    <main className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><BookOpen size={20} strokeWidth={1.8} /></div>
          <div><strong>stillroom</strong><span>READING SPACE</span></div>
        </div>

        <div className="workspace">
          <div className="workspace-icon">S</div>
          <div className="workspace-name">
            <strong>{settings.name}</strong>
            <span>Admin workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          {[
            [LayoutDashboard, "Overview"],
            [Users, "Students"],
            [BookOpen, "Seat map"],
            [CreditCard, "Payments"],
          ].map(([Icon, label]: any) => (
            <button
              className={`nav-item ${active === label ? "active" : ""}`}
              key={label}
              onClick={() => { setActive(label); notify(`${label} view active`); }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Payments" && pendingDuesTotal > 0 && <i className="nav-count">1</i>}
              {label === "Students" && <span style={{ fontSize: 10, opacity: 0.6 }}>{studentsList.length}</span>}
            </button>
          ))}
        </nav>

        <div className="nav-label tools-label">PREFERENCES</div>
        <nav className="navigation">
          <button className={`nav-item ${active === "Settings" ? "active" : ""}`} onClick={() => setActive("Settings")}>
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
          <button className={`nav-item ${active === "Help center" ? "active" : ""}`} onClick={() => setActive("Help center")}>
            <CircleHelp size={18} strokeWidth={1.8} />
            <span>Help center</span>
          </button>
          <button className="nav-item" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === "dark" ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
            <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="plan-top">
              <span className="plan-dot" /> LIVE CAPACITY <span className="plan-live">LIVE</span>
            </div>
            <strong>{Math.round((occupiedCount / 32) * 100)}% Occupied</strong>
            <p>{occupiedCount} students studying now. {availableCount} desks open.</p>
            <div className="progress">
              <i style={{ width: `${(occupiedCount / 32) * 100}%` }} />
            </div>
            <small>{occupiedCount} of 32 seats filled</small>
          </div>

          <button className="profile">
            <div className="avatar admin-avatar">SP</div>
            <div className="profile-meta">
              <strong>Sara Patel</strong>
              <span>Head Administrator</span>
            </div>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <section className="main-area">
        <header className="topbar">
          <div className="crumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <button
              className="icon-btn search-trigger"
              onClick={() => {
                if (active !== "Students") setActive("Students");
                document.getElementById("student-search-input")?.focus();
              }}
              title="Search"
            >
              <Search size={18} />
            </button>

            <button
              className="icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button className="icon-btn notification" onClick={() => notify("All notifications cleared. 0 pending alerts.")} title="Notifications">
              <Bell size={18} /><i />
            </button>

            <div className="top-divider" />

            <button className="view-switch" onClick={() => setStudentView(true)}>
              <span className="view-dot" /> Student view <ArrowUpRight size={14} />
            </button>
          </div>
        </header>

        <div className="content">
          {/* ================= PAGE: OVERVIEW ================= */}
          {active === "Overview" && (
            <div>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow"><span /> LIVE STATUS · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</div>
                  <h1>A little room to <em>focus.</em></h1>
                  <p className="welcome-copy">Here’s an overview of seats, students, and collections today.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="action-btn-secondary" onClick={() => setActive("Seat map")}>
                    <BookOpen size={15} /> Seat Map
                  </button>
                  <button className="invite-button" onClick={() => setShowAddStudentModal(true)}>
                    <Plus size={17} /> Add Student <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <article className="stat-card" onClick={() => setActive("Students")} style={{ cursor: "pointer" }}>
                  <div className="stat-head">
                    <span>Total students</span>
                    <span className="stat-icon green"><Users size={17} /></span>
                  </div>
                  <div className="stat-value">{studentsList.length} <span className="stat-trend"><ArrowUpRight size={13} /> +12%</span></div>
                  <div className="stat-foot">Registered readers <span>Active</span></div>
                  <div className="sparkline green-line"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M0 25 C15 24 15 19 28 20 S44 12 55 16 S72 6 83 11 S104 3 120 4" /></svg></div>
                </article>

                <article className="stat-card" onClick={() => setActive("Seat map")} style={{ cursor: "pointer" }}>
                  <div className="stat-head">
                    <span>Seats available</span>
                    <span className="stat-icon blue"><LayoutDashboard size={17} /></span>
                  </div>
                  <div className="stat-value">{availableCount}<span className="stat-denom"> / 32</span></div>
                  <div className="stat-foot"><span className="inline-dot green-dot" /> {reservedCount} reserved</div>
                  <div className="seat-meter"><span style={{ width: `${(occupiedCount / 32) * 100}%` }} /></div>
                </article>

                <article className="stat-card" onClick={() => setActive("Payments")} style={{ cursor: "pointer" }}>
                  <div className="stat-head">
                    <span>Collected fees</span>
                    <span className="stat-icon yellow"><CreditCard size={17} /></span>
                  </div>
                  <div className="stat-value">₹{totalCollected.toLocaleString()}</div>
                  <div className="stat-foot">of ₹{(totalCollected + pendingDuesTotal).toLocaleString()} expected <span className="positive-text">96%</span></div>
                  <div className="sparkline gold-line"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M0 26 C15 25 20 18 33 21 S48 13 60 16 S80 8 91 12 S108 2 120 3" /></svg></div>
                </article>

                <article className="stat-card dues-card" onClick={() => setActive("Payments")} style={{ cursor: "pointer" }}>
                  <div className="stat-head">
                    <span>Pending dues</span>
                    <span className="stat-icon coral"><Clock3 size={17} /></span>
                  </div>
                  <div className="stat-value">₹{pendingDuesTotal.toLocaleString()}</div>
                  <div className="stat-foot"><span className="inline-dot coral-dot" /> {studentsList.filter(s => s.payment === "Pending").length} student pending</div>
                  <button className="text-link" onClick={(e) => { e.stopPropagation(); setActive("Payments"); }}>
                    Review payments <ArrowUpRight size={13} />
                  </button>
                </article>
              </div>

              <div className="dashboard-grid">
                {/* Mini Seat Map */}
                <section className="panel seat-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">INTERACTIVE FLOOR PLAN</div>
                      <h2>Seat status <span className="live-pill"><i /> LIVE</span></h2>
                    </div>
                    <button className="action-btn-ghost" onClick={() => setActive("Seat map")}>
                      Full view <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <div className="map-summary">
                    <div>
                      <span className="summary-large">{availableCount}</span>
                      <span className="summary-caption">desks currently open</span>
                    </div>
                    <div className="legend">
                      <span><i className="legend-open" /> Available</span>
                      <span><i className="legend-taken" /> Occupied</span>
                      <span><i className="legend-held" /> Reserved</span>
                    </div>
                  </div>

                  <div className="floor-plan">
                    <div className="zone-label"><span>01</span><i /> QUIET ZONE <small>· 16 seats</small></div>
                    <div className="seat-grid">
                      {seats.slice(0, 16).map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          onClick={() => setInspectSeat(seat)}
                        />
                      ))}
                    </div>

                    <div className="zone-divider"><span>glass partition</span></div>

                    <div className="zone-label window-label"><span>02</span><i /> WINDOW SIDE <small>· 16 seats</small></div>
                    <div className="seat-grid">
                      {seats.slice(16).map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          onClick={() => setInspectSeat(seat)}
                        />
                      ))}
                    </div>

                    <div className="map-bottom">
                      <span><i /> Entrance</span>
                      <span className="map-note">Click any seat to inspect or book</span>
                      <span className="map-scale">NOT TO SCALE</span>
                    </div>
                  </div>
                </section>

                {/* Activity */}
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">A QUICK LOOK</div>
                      <h2>Today at a glance</h2>
                    </div>
                    <button className="more-button" onClick={() => notify("Checked in logs up to date")}>
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div className="day-card">
                    <div className="day-card-top">
                      <CalendarDays size={16} />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</span>
                      <span className="day-now">TODAY</span>
                    </div>
                    <div className="day-stats">
                      <div><strong>{occupiedCount}</strong><span>Checked in</span></div>
                      <div><strong>{availableCount}</strong><span>Available</span></div>
                    </div>
                    <div className="checkin-avatars">
                      <div className="mini-avatar sage">AM</div>
                      <div className="mini-avatar peach">DS</div>
                      <div className="mini-avatar lilac">IR</div>
                      <div className="mini-avatar blue">MK</div>
                      <div className="mini-avatar muted-avatar">+{occupiedCount - 4}</div>
                      <span>readers studying right now</span>
                    </div>
                  </div>

                  <div className="activity-heading">
                    <h3>Recent updates</h3>
                    <button onClick={() => setActive("Students")}>See all</button>
                  </div>

                  <div className="activity-list">
                    <Activity color="peach" initials="DS" title="Fee due reminder" detail="Diya Shah · Seat A-03" time="9:42 AM" />
                    <Activity color="sage" initials="+" title="New admission" detail="Tara Nair · Seat B-11" time="9:18 AM" />
                    <Activity color="blue" initials="✓" title="Check-in registered" detail="Meera Kapoor · Seat A-08" time="8:56 AM" />
                    <Activity color="lilac" initials="₹" title="Payment cleared" detail="Aarav Mehta · ₹1,200 UPI" time="Yesterday" />
                  </div>

                  <button className="view-activity" onClick={() => setActive("Students")}>
                    Manage all students <ArrowUpRight size={14} />
                  </button>
                </section>
              </div>

              {/* Quick Students preview */}
              <section className="panel students-panel" style={{ marginTop: 18 }}>
                <div className="panel-heading students-heading">
                  <div>
                    <div className="section-kicker">DIRECTORY</div>
                    <h2>Registered students <span className="student-count">{studentsList.length} total</span></h2>
                  </div>
                  <div className="table-tools">
                    <button className="action-btn-primary" onClick={() => setShowAddStudentModal(true)}>
                      <Plus size={14} /> Add Student
                    </button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>STUDENT</th>
                        <th>SEAT</th>
                        <th>PLAN</th>
                        <th>PHONE</th>
                        <th>FEE STATUS</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.slice(0, 5).map((student) => (
                        <tr key={student.id}>
                          <td>
                            <div className="student-cell">
                              <div className={`avatar ${student.color}`}>{student.initials}</div>
                              <div>
                                <strong>{student.name}</strong>
                                <div style={{ fontSize: 10, color: "var(--muted)" }}>{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="seat-code">{student.seat}</span></td>
                          <td><span style={{ fontSize: 11 }}>{student.plan}</span></td>
                          <td><span style={{ fontSize: 11 }}>{student.phone}</span></td>
                          <td>
                            <span
                              className={`payment-badge ${student.payment === "Paid" ? "paid" : "pending"}`}
                              onClick={() => toggleStudentPayment(student.id)}
                              title="Click to toggle status"
                              style={{ cursor: "pointer" }}
                            >
                              <i />{student.payment}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn-ghost" onClick={() => setActive("Students")}>
                              Details <ArrowUpRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="all-students" onClick={() => setActive("Students")}>
                  Open full students manager ({studentsList.length}) <ArrowUpRight size={14} />
                </button>
              </section>
            </div>
          )}

          {/* ================= PAGE: STUDENTS ================= */}
          {active === "Students" && (
            <div>
              <div className="view-header">
                <div className="view-header-row">
                  <div>
                    <div className="eyebrow"><span /> DIRECTORY & ADMISSIONS</div>
                    <h1>Students Management</h1>
                    <p className="view-desc">Manage reading room memberships, desk assignments, and payment statuses.</p>
                  </div>
                  <div className="view-actions">
                    <button className="action-btn-primary" onClick={() => setShowAddStudentModal(true)}>
                      <Plus size={15} /> Add New Student
                    </button>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="toolbar-card">
                <div className="pills-group">
                  {(["All", "Paid", "Pending"] as const).map(tab => (
                    <button
                      key={tab}
                      className={`pill-btn ${studentFilter === tab ? "active" : ""}`}
                      onClick={() => setStudentFilter(tab)}
                    >
                      {tab} ({tab === "All" ? studentsList.length : studentsList.filter(s => s.payment === tab).length})
                    </button>
                  ))}
                </div>

                <div className="search-box" style={{ width: 240 }}>
                  <Search size={15} />
                  <input
                    id="student-search-input"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search name, seat, or phone..."
                  />
                  {studentQuery && <X size={14} style={{ cursor: "pointer" }} onClick={() => setStudentQuery("")} />}
                </div>
              </div>

              {/* Table */}
              <div className="data-card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>STUDENT</th>
                        <th>ASSIGNED SEAT</th>
                        <th>PLAN</th>
                        <th>JOINED</th>
                        <th>PHONE</th>
                        <th>FEE STATUS</th>
                        <th style={{ textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList
                        .filter(s => {
                          if (studentFilter !== "All" && s.payment !== studentFilter) return false;
                          if (studentQuery) {
                            const q = studentQuery.toLowerCase();
                            return s.name.toLowerCase().includes(q) || s.seat.toLowerCase().includes(q) || s.phone.includes(q);
                          }
                          return true;
                        })
                        .map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-cell">
                                <div className={`avatar ${student.color}`}>{student.initials}</div>
                                <div>
                                  <strong>{student.name}</strong>
                                  <div className="contact-meta">
                                    <Mail size={11} /> {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td><span className="seat-code">{student.seat}</span></td>
                            <td><span style={{ fontSize: 11, fontWeight: 500 }}>{student.plan}</span></td>
                            <td><span style={{ fontSize: 11 }}>{student.date}</span></td>
                            <td><span style={{ fontSize: 11 }}>{student.phone}</span></td>
                            <td>
                              <span
                                className={`payment-badge ${student.payment === "Paid" ? "paid" : "pending"}`}
                                onClick={() => toggleStudentPayment(student.id)}
                                title="Click to toggle Paid/Pending"
                                style={{ cursor: "pointer" }}
                              >
                                <i />{student.payment}
                              </span>
                            </td>
                            <td>
                              <div className="table-action-btns">
                                <button
                                  className="icon-action-btn"
                                  onClick={() => {
                                    notify(`Reminder message copied for ${student.name}`);
                                    navigator.clipboard?.writeText(`Dear ${student.name}, reminder regarding Stillroom study hall fee.`);
                                  }}
                                  title="Send Reminder"
                                >
                                  <Phone size={14} />
                                </button>
                                <button
                                  className="icon-action-btn danger"
                                  onClick={() => {
                                    if (confirm(`Remove student ${student.name}? This will free up seat ${student.seat}.`)) {
                                      const seatNum = parseInt(student.seat.replace(/[AB]-/, ""), 10) + (student.seat.startsWith("B") ? 16 : 0);
                                      setSeats(prev => prev.map(s => s.id === seatNum ? { ...s, status: "available", name: undefined } : s));
                                      setStudentsList(prev => prev.filter(s => s.id !== student.id));
                                      notify(`Student ${student.name} removed and desk vacated.`);
                                    }
                                  }}
                                  title="Remove Student"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: SEAT MAP ================= */}
          {active === "Seat map" && (
            <div>
              <div className="view-header">
                <div className="view-header-row">
                  <div>
                    <div className="eyebrow"><span /> FLOOR PLAN & CAPACITY</div>
                    <h1>Interactive Seat Map</h1>
                    <p className="view-desc">Live desk layout with zone controls, real-time vacancy inspection, and allocation.</p>
                  </div>
                  <div className="view-actions">
                    <button className="action-btn-primary" onClick={() => setShowAddStudentModal(true)}>
                      <Plus size={15} /> Allocate Seat
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter pills */}
              <div className="toolbar-card">
                <div className="pills-group">
                  {[
                    ["All", `All Desks (${seats.length})`],
                    ["Available", `Available (${availableCount})`],
                    ["Occupied", `Occupied (${occupiedCount})`],
                    ["Reserved", `Reserved (${reservedCount})`],
                    ["Quiet", "Quiet Zone (1-16)"],
                    ["Window", "Window Side (17-32)"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`pill-btn ${seatFilter === key ? "active" : ""}`}
                      onClick={() => setSeatFilter(key as any)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="legend">
                  <span><i className="legend-open" /> Available</span>
                  <span><i className="legend-taken" /> Occupied</span>
                  <span><i className="legend-held" /> Reserved</span>
                </div>
              </div>

              <div className="seat-map-layout">
                {/* Main floor plan panel */}
                <div className="panel seat-panel">
                  <div className="floor-plan" style={{ padding: 22 }}>
                    {/* Quiet Zone */}
                    {(seatFilter === "All" || seatFilter === "Quiet" || seatFilter === "Available" || seatFilter === "Occupied" || seatFilter === "Reserved") && (
                      <div style={{ marginBottom: 20 }}>
                        <div className="zone-label">
                          <span>ZONE 01</span><i /> QUIET STUDY ZONE <small>· Desks A-01 to A-16</small>
                        </div>
                        <div className="seat-grid" style={{ gap: 10, margin: "14px 0" }}>
                          {seats.slice(0, 16).map((seat) => {
                            const isMatch =
                              seatFilter === "All" ||
                              seatFilter === "Quiet" ||
                              (seatFilter === "Available" && seat.status === "available") ||
                              (seatFilter === "Occupied" && seat.status === "occupied") ||
                              (seatFilter === "Reserved" && seat.status === "reserved");

                            return (
                              <div key={seat.id} style={{ opacity: isMatch ? 1 : 0.25, transition: "opacity 0.2s" }}>
                                <SeatButton
                                  seat={seat}
                                  onClick={() => setInspectSeat(seat)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="zone-divider"><span>Acoustic Glass Divider · Silent Area</span></div>

                    {/* Window Side */}
                    {(seatFilter === "All" || seatFilter === "Window" || seatFilter === "Available" || seatFilter === "Occupied" || seatFilter === "Reserved") && (
                      <div>
                        <div className="zone-label window-label">
                          <span>ZONE 02</span><i /> NATURAL LIGHT WINDOW SIDE <small>· Desks B-01 to B-16</small>
                        </div>
                        <div className="seat-grid" style={{ gap: 10, margin: "14px 0" }}>
                          {seats.slice(16).map((seat) => {
                            const isMatch =
                              seatFilter === "All" ||
                              seatFilter === "Window" ||
                              (seatFilter === "Available" && seat.status === "available") ||
                              (seatFilter === "Occupied" && seat.status === "occupied") ||
                              (seatFilter === "Reserved" && seat.status === "reserved");

                            return (
                              <div key={seat.id} style={{ opacity: isMatch ? 1 : 0.25, transition: "opacity 0.2s" }}>
                                <SeatButton
                                  seat={seat}
                                  onClick={() => setInspectSeat(seat)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="map-bottom" style={{ marginTop: 14 }}>
                      <span><i /> Main Door Entrance</span>
                      <span className="map-note">Click any desk icon to view reader details or modify allocation</span>
                      <span className="map-scale">32 TOTAL DESKS</span>
                    </div>
                  </div>
                </div>

                {/* Seat Inspector sidebar */}
                <div className="seat-inspector">
                  <div className="section-kicker">DESK INSPECTOR</div>
                  {inspectSeat ? (
                    <div>
                      <div className="inspector-seat-badge">
                        Desk {inspectSeat.id <= 16 ? "A" : "B"}-{String((inspectSeat.id - 1) % 16 + 1).padStart(2, "0")}
                        <span className={`payment-badge ${inspectSeat.status === "available" ? "paid" : inspectSeat.status === "occupied" ? "paid" : "pending"}`} style={{ fontSize: 9 }}>
                          <i />{inspectSeat.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        {inspectSeat.zone} · High-speed Wi-Fi, Dedicated Power Socket, Task Lamp
                      </p>

                      <div className="inspector-meta-grid">
                        <div className="inspector-meta-item">
                          <label>OCCUPANT</label>
                          <strong>{inspectSeat.name || "None (Vacant)"}</strong>
                        </div>
                        <div className="inspector-meta-item">
                          <label>MONTHLY FEE</label>
                          <strong>₹{settings.monthlyFee}</strong>
                        </div>
                        <div className="inspector-meta-item">
                          <label>POWER SOCKET</label>
                          <strong>Working (230V)</strong>
                        </div>
                        <div className="inspector-meta-item">
                          <label>STATUS</label>
                          <strong style={{ textTransform: "capitalize" }}>{inspectSeat.status}</strong>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                        {inspectSeat.status === "available" && (
                          <button
                            className="action-btn-primary"
                            style={{ justifyContent: "center" }}
                            onClick={() => {
                              setNewStudentSeat(String(inspectSeat.id));
                              setShowAddStudentModal(true);
                            }}
                          >
                            <Plus size={15} /> Assign to Student
                          </button>
                        )}

                        {inspectSeat.status === "occupied" && (
                          <button
                            className="action-btn-secondary"
                            style={{ justifyContent: "center", color: "var(--rose)" }}
                            onClick={() => handleVacateSeat(inspectSeat.id)}
                          >
                            <Trash2 size={14} /> Vacate / Release Desk
                          </button>
                        )}

                        {inspectSeat.status === "reserved" && (
                          <button
                            className="action-btn-primary"
                            style={{ justifyContent: "center" }}
                            onClick={() => {
                              setSeats(prev => prev.map(s => s.id === inspectSeat.id ? { ...s, status: "available" } : s));
                              setInspectSeat(null);
                              notify("Reservation cleared. Desk is now available.");
                            }}
                          >
                            Clear Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--muted)" }}>
                      <BookOpen size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                      <strong style={{ display: "block", color: "var(--ink)", fontSize: 13, marginBottom: 4 }}>
                        No Desk Selected
                      </strong>
                      <span style={{ fontSize: 11 }}>
                        Click on any seat on the floor plan to view occupant details, fees, and manage status.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: PAYMENTS ================= */}
          {active === "Payments" && (
            <div>
              <div className="view-header">
                <div className="view-header-row">
                  <div>
                    <div className="eyebrow"><span /> BILLING & FINANCIALS</div>
                    <h1>Payments & Accounts</h1>
                    <p className="view-desc">Track subscription fees, verify online UPI transactions, and issue receipts.</p>
                  </div>
                  <div className="view-actions">
                    <button className="action-btn-primary" onClick={() => setShowRecordPaymentModal(true)}>
                      <Plus size={15} /> Record Payment
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial metrics */}
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-head">
                    <span>Total Collected</span>
                    <span className="stat-icon green"><CreditCard size={17} /></span>
                  </div>
                  <div className="stat-value">₹{totalCollected.toLocaleString()}</div>
                  <div className="stat-foot">Month of October <span>Verified</span></div>
                </article>

                <article className="stat-card dues-card">
                  <div className="stat-head">
                    <span>Pending Dues</span>
                    <span className="stat-icon coral"><Clock3 size={17} /></span>
                  </div>
                  <div className="stat-value">₹{pendingDuesTotal.toLocaleString()}</div>
                  <div className="stat-foot"><span className="inline-dot coral-dot" /> Action required</div>
                </article>

                <article className="stat-card">
                  <div className="stat-head">
                    <span>Collection Rate</span>
                    <span className="stat-icon blue"><Sparkles size={17} /></span>
                  </div>
                  <div className="stat-value">
                    {Math.round((totalCollected / (totalCollected + pendingDuesTotal || 1)) * 100)}%
                  </div>
                  <div className="stat-foot">Target: 95%+ <span className="positive-text">On track</span></div>
                </article>

                <article className="stat-card">
                  <div className="stat-head">
                    <span>Active Subscriptions</span>
                    <span className="stat-icon yellow"><Users size={17} /></span>
                  </div>
                  <div className="stat-value">{studentsList.length}</div>
                  <div className="stat-foot">₹{settings.monthlyFee} / month per desk</div>
                </article>
              </div>

              {/* Filter pills */}
              <div className="toolbar-card">
                <div className="pills-group">
                  {(["All", "Paid", "Pending"] as const).map(tab => (
                    <button
                      key={tab}
                      className={`pill-btn ${paymentFilter === tab ? "active" : ""}`}
                      onClick={() => setPaymentFilter(tab)}
                    >
                      {tab} ({tab === "All" ? paymentsList.length : paymentsList.filter(p => p.status === tab).length})
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Showing {paymentsList.filter(p => paymentFilter === "All" || p.status === paymentFilter).length} transactions
                </div>
              </div>

              {/* Ledger Table */}
              <div className="data-card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>INVOICE #</th>
                        <th>STUDENT</th>
                        <th>DESK</th>
                        <th>AMOUNT</th>
                        <th>DATE</th>
                        <th>PAYMENT METHOD</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: "right" }}>RECEIPT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsList
                        .filter(p => paymentFilter === "All" || p.status === paymentFilter)
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td>
                              <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--indigo)" }}>
                                {tx.invoiceId}
                              </span>
                            </td>
                            <td><strong>{tx.studentName}</strong></td>
                            <td><span className="seat-code">{tx.seat}</span></td>
                            <td><strong style={{ color: "var(--ink)" }}>₹{tx.amount.toLocaleString()}</strong></td>
                            <td><span style={{ fontSize: 11 }}>{tx.date}</span></td>
                            <td><span style={{ fontSize: 11 }}>{tx.method}</span></td>
                            <td>
                              <span className={`payment-badge ${tx.status === "Paid" ? "paid" : "pending"}`}>
                                <i />{tx.status}
                              </span>
                            </td>
                            <td>
                              <div className="table-action-btns">
                                <button
                                  className="action-btn-secondary"
                                  style={{ padding: "5px 10px", fontSize: 10 }}
                                  onClick={() => setViewReceipt(tx)}
                                >
                                  <FileText size={12} /> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: SETTINGS ================= */}
          {active === "Settings" && (
            <div>
              <div className="view-header">
                <div className="view-header-row">
                  <div>
                    <div className="eyebrow"><span /> CONFIGURATION & PREFERENCES</div>
                    <h1>Hall Preferences</h1>
                    <p className="view-desc">Configure library operational hours, pricing rules, Wi-Fi passwords, and facilities.</p>
                  </div>
                  <div className="view-actions">
                    <button
                      className="action-btn-primary"
                      onClick={() => notify("All configuration changes saved successfully!")}
                    >
                      <Check size={15} /> Save All Changes
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-section-title">Reading Room Profile</div>
                <div className="settings-section-subtitle">Official study hall name, address, and primary contact phone for students.</div>

                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label>HALL NAME</label>
                    <input
                      className="settings-input"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label>TAGLINE</label>
                    <input
                      className="settings-input"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label>FULL ADDRESS</label>
                  <input
                    className="settings-input"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>

                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label>SUPPORT PHONE</label>
                    <input
                      className="settings-input"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label>ADMIN EMAIL</label>
                    <input
                      className="settings-input"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-section-title" style={{ marginTop: 24 }}>Pricing & Membership</div>
                <div className="settings-section-subtitle">Set monthly subscription charges, caution deposits, and locker rates.</div>

                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label>MONTHLY DESK FEE (₹)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.monthlyFee}
                      onChange={(e) => setSettings({ ...settings, monthlyFee: Number(e.target.value) })}
                    />
                  </div>
                  <div className="settings-field">
                    <label>SECURITY DEPOSIT (₹)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.deposit}
                      onChange={(e) => setSettings({ ...settings, deposit: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="settings-section-title" style={{ marginTop: 24 }}>Facilities & Wi-Fi Network</div>
                <div className="settings-section-subtitle">Shared credentials shown on the student portal and check-in confirmation.</div>

                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label>WI-FI SSID (NETWORK NAME)</label>
                    <input
                      className="settings-input"
                      value={settings.wifiSSID}
                      onChange={(e) => setSettings({ ...settings, wifiSSID: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label>WI-FI PASSWORD</label>
                    <input
                      className="settings-input"
                      value={settings.wifiPass}
                      onChange={(e) => setSettings({ ...settings, wifiPass: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label>OPENING TIME</label>
                    <input
                      className="settings-input"
                      value={settings.openTime}
                      onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                    />
                  </div>
                  <div className="settings-field">
                    <label>CLOSING TIME</label>
                    <input
                      className="settings-input"
                      value={settings.closeTime}
                      onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-footer">
                  <button className="action-btn-secondary" onClick={() => notify("Settings reset to defaults")}>
                    Reset
                  </button>
                  <button
                    className="action-btn-primary"
                    onClick={() => notify("Preferences updated and applied!")}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE: HELP CENTER ================= */}
          {active === "Help center" && (
            <div>
              <div className="view-header">
                <div className="view-header-row">
                  <div>
                    <div className="eyebrow"><span /> DOCUMENTATION & ASSISTANCE</div>
                    <h1>Help & Support Center</h1>
                    <p className="view-desc">Operational guides, seat allocation rules, and direct admin assistance.</p>
                  </div>
                  <div className="view-actions">
                    <button
                      className="action-btn-secondary"
                      onClick={() => notify("Support inquiry sent to administrator team")}
                    >
                      <Mail size={15} /> Contact Support
                    </button>
                  </div>
                </div>
              </div>

              {/* Guide cards */}
              <div className="help-grid">
                <div className="help-card" onClick={() => setActive("Seat map")} style={{ cursor: "pointer" }}>
                  <div className="help-card-icon"><BookOpen size={18} /></div>
                  <strong>Seat Allocation</strong>
                  <p>How to assign, reserve, or vacate desks in Quiet and Window zones.</p>
                </div>

                <div className="help-card" onClick={() => setActive("Payments")} style={{ cursor: "pointer" }}>
                  <div className="help-card-icon"><CreditCard size={18} /></div>
                  <strong>Fee Collection</strong>
                  <p>Recording UPI payments, sending WhatsApp reminders, and receipts.</p>
                </div>

                <div className="help-card" onClick={() => setActive("Students")} style={{ cursor: "pointer" }}>
                  <div className="help-card-icon"><Users size={18} /></div>
                  <strong>Member Directory</strong>
                  <p>Registering admissions, updating phone contacts, and membership plans.</p>
                </div>

                <div className="help-card" onClick={() => setActive("Settings")} style={{ cursor: "pointer" }}>
                  <div className="help-card-icon"><Wifi size={18} /></div>
                  <strong>Wi-Fi & Timings</strong>
                  <p>Updating study hall operational hours and student network credentials.</p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="faq-card">
                <div className="settings-section-title">Frequently Asked Questions</div>
                <div className="settings-section-subtitle">Quick answers to common study hall management tasks.</div>

                {[
                  {
                    q: "How do I allocate or change a student's seat?",
                    a: "Go to 'Seat map', click on any available seat (green), and click 'Assign to Student'. Alternatively, from the 'Students' page, click 'Add New Student' and pick a desk."
                  },
                  {
                    q: "How do I mark pending fee payments as paid?",
                    a: "You can simply click directly on the 'Pending' badge in the Students or Payments table. It will instantly toggle to 'Paid' and update the revenue ledger."
                  },
                  {
                    q: "What happens when a student vacates their desk?",
                    a: "Go to the Seat Map, click on their desk, and choose 'Vacate / Release Desk'. The seat will immediately become green (available) and ready for a new student."
                  },
                  {
                    q: "Can students view available seats online?",
                    a: "Yes! Click the 'Student view' button in the top right corner. It opens a clean, student-facing portal where readers can check live seat availability and request desks."
                  },
                ].map((faq, idx) => (
                  <div className="faq-item" key={idx}>
                    <button className="faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={16}
                        style={{
                          transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s"
                        }}
                      />
                    </button>
                    {openFaq === idx && <p className="faq-answer">{faq.a}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <footer className="footer">
            <span>Made for quieter mornings and focused ideas <span className="footer-spark">✳</span></span>
            <span>stillroom · {settings.name}</span>
          </footer>
        </div>
      </section>

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="modal-backdrop" onClick={() => setShowAddStudentModal(false)}>
          <form className="booking-modal" onSubmit={handleAddStudent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowAddStudentModal(false)}><X size={18} /></button>
            <div className="modal-icon"><Users size={21} /></div>
            <div className="section-kicker">NEW ADMISSION</div>
            <h2>Register Student</h2>
            <p>Add a new reader and assign their dedicated study desk.</p>

            <div className="modal-field">
              <label htmlFor="student-name">FULL NAME *</label>
              <input
                id="student-name"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="e.g. Priya Nair"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="student-email">EMAIL ADDRESS</label>
              <input
                id="student-email"
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="priya.nair@example.com"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="student-phone">PHONE NUMBER</label>
              <input
                id="student-phone"
                value={newStudentPhone}
                onChange={(e) => setNewStudentPhone(e.target.value)}
                placeholder="+91 98470 12345"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="student-seat-select">ASSIGN DESK</label>
              <select
                id="student-seat-select"
                className="settings-select"
                value={newStudentSeat}
                onChange={(e) => setNewStudentSeat(e.target.value)}
              >
                <option value="">Auto-assign first available desk</option>
                {seats.filter(s => s.status === "available").map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.id <= 16 ? "A" : "B"}-{String((s.id - 1) % 16 + 1).padStart(2, "0")} ({s.zone})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="invite-button modal-submit">
              Complete Admission <ArrowUpRight size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: RECORD PAYMENT ================= */}
      {showRecordPaymentModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordPaymentModal(false)}>
          <form className="booking-modal" onSubmit={handleRecordPayment} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowRecordPaymentModal(false)}><X size={18} /></button>
            <div className="modal-icon"><CreditCard size={21} /></div>
            <div className="section-kicker">ACCOUNTS & BILLING</div>
            <h2>Record Payment</h2>
            <p>Log a monthly subscription payment from a student.</p>

            <div className="modal-field">
              <label htmlFor="pay-student">SELECT STUDENT *</label>
              <select
                id="pay-student"
                required
                className="settings-select"
                value={paymentStudent}
                onChange={(e) => setPaymentStudent(e.target.value)}
              >
                <option value="">Choose student...</option>
                {studentsList.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.seat}) — {s.payment}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="pay-amount">AMOUNT (₹) *</label>
              <input
                id="pay-amount"
                type="number"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="pay-method">PAYMENT METHOD</label>
              <select
                id="pay-method"
                className="settings-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>

            <button type="submit" className="invite-button modal-submit">
              Log & Issue Receipt <ArrowUpRight size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: RECEIPT VIEW ================= */}
      {viewReceipt && (
        <div className="modal-backdrop" onClick={() => setViewReceipt(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewReceipt(null)}><X size={18} /></button>
            <div className="modal-icon"><FileText size={21} /></div>
            <div className="section-kicker">OFFICIAL RECEIPT</div>
            <h2>{viewReceipt.invoiceId}</h2>
            <p>Payment confirmation for {settings.name}</p>

            <div className="inspector-meta-grid" style={{ margin: "16px 0" }}>
              <div className="inspector-meta-item">
                <label>STUDENT</label>
                <strong>{viewReceipt.studentName}</strong>
              </div>
              <div className="inspector-meta-item">
                <label>DESK</label>
                <strong>{viewReceipt.seat}</strong>
              </div>
              <div className="inspector-meta-item">
                <label>AMOUNT PAID</label>
                <strong>₹{viewReceipt.amount.toLocaleString()}</strong>
              </div>
              <div className="inspector-meta-item">
                <label>METHOD</label>
                <strong>{viewReceipt.method}</strong>
              </div>
            </div>

            <button
              className="action-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                notify("Receipt downloaded as PDF preview");
                setViewReceipt(null);
              }}
            >
              <Download size={15} /> Download PDF Receipt
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </main>
  );
}

// ================= STUDENT PORTAL VIEW =================
function StudentPortal({
  seats,
  theme,
  onToggleTheme,
  onBack,
  onSelect
}: {
  seats: Seat[];
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onBack: () => void;
  onSelect: (seat: Seat) => void;
}) {
  const available = seats.filter((seat) => seat.status === "available").length;

  return (
    <main className="student-portal">
      <header className="student-header">
        <a className="brand" href="#">
          <div className="brand-mark"><BookOpen size={20} /></div>
          <div><strong>stillroom</strong><span>READING SPACE</span></div>
        </a>
        <div className="top-actions">
          <button
            className="icon-btn theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="view-switch" onClick={onBack}>
            Admin preview <ArrowUpRight size={14} />
          </button>
        </div>
      </header>

      <section className="student-hero">
        <div className="student-intro">
          <div className="eyebrow"><span /> SERENITY STUDY HALL · MEMBERSHIP</div>
          <h1>Find your little <em>corner.</em></h1>
          <p>Choose a desk that feels right. We’ll confirm your seat booking shortly.</p>
          <div className="student-availability">
            <span className="availability-dot" />
            <strong>{available} desks available</strong>
            <span>· ₹1,200 / month · High-speed Wi-Fi</span>
          </div>
        </div>

        <div className="student-note">
          <BookOpen size={19} />
          <strong>A calmer place to focus</strong>
          <span>Quiet study zones, ergonomic seating, dedicated power points, and a place that’s yours.</span>
        </div>
      </section>

      <section className="student-map-panel">
        <div className="panel-heading">
          <div>
            <div className="section-kicker">PICK YOUR PREFERRED SEAT</div>
            <h2>Reading room floor plan</h2>
          </div>
          <div className="legend">
            <span><i className="legend-open" /> Available</span>
            <span><i className="legend-taken" /> Occupied</span>
            <span><i className="legend-held" /> Reserved</span>
          </div>
        </div>

        <div className="student-floor-plan">
          <div className="zone-label"><span>01</span><i /> QUIET ZONE <small>· 16 seats</small></div>
          <div className="seat-grid">
            {seats.slice(0, 16).map((seat) => (
              <SeatButton
                key={seat.id}
                seat={seat}
                onClick={() => seat.status === "available" && onSelect(seat)}
              />
            ))}
          </div>

          <div className="zone-divider"><span>glass partition</span></div>

          <div className="zone-label"><span>02</span><i /> WINDOW SIDE <small>· 16 seats</small></div>
          <div className="seat-grid">
            {seats.slice(16).map((seat) => (
              <SeatButton
                key={seat.id}
                seat={seat}
                onClick={() => seat.status === "available" && onSelect(seat)}
              />
            ))}
          </div>

          <div className="map-bottom">
            <span><i /> Entrance</span>
            <span className="map-note">Choose any open seat to request it</span>
            <span className="map-scale">NOT TO SCALE</span>
          </div>
        </div>
      </section>

      <footer className="student-footer">
        Questions? Contact Serenity Study Hall · Membership requests are approved by room admin.
      </footer>
    </main>
  );
}

// Seat Button Component
function SeatButton({ seat, onClick }: { seat: Seat; onClick: () => void }) {
  const deskLabel = `Desk ${seat.id <= 16 ? "A" : "B"}-${String((seat.id - 1) % 16 + 1).padStart(2, "0")}`;
  const deskNumber = String((seat.id - 1) % 16 + 1).padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className={`seat ${seat.status}`}
      aria-label={`${deskLabel}, ${seat.status}${seat.name ? `, ${seat.name}` : ""}`}
      title={seat.status === "occupied" ? `Occupied by ${seat.name ?? "a student"}` : seat.status === "reserved" ? "Reserved" : `${deskLabel} (Available)`}
    >
      {seat.status === "occupied" ? (
        <span className="seat-person">
          {seat.name?.split(" ").map((x) => x[0]).slice(0, 2).join("")}
        </span>
      ) : seat.status === "reserved" ? (
        <Clock3 size={13} />
      ) : (
        <span>{deskNumber}</span>
      )}
    </button>
  );
}

// Activity Item
function Activity({
  color,
  initials,
  title,
  detail,
  time
}: {
  color: string;
  initials: string;
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="activity-item">
      <div className={`activity-icon ${color}`}>{initials}</div>
      <div className="activity-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </div>
  );
}
