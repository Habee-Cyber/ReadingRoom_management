"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Bell, BookOpen, CalendarDays, Check,
  ChevronDown, CircleHelp, Clock3, CreditCard, Database, Download, Edit3,
  ExternalLink, FileText, Filter, HelpCircle, LayoutDashboard,
  LogOut, Mail, Moon, MoreHorizontal, Phone, Plus, RefreshCw,
  Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles,
  Sun, Trash2, Users, Wifi, X, AlertTriangle, Copy
} from "lucide-react";
import {
  checkSupabaseConnection,
  getDbSeats,
  getDbStudents,
  getDbPayments,
  getDbSettings,
  insertDbStudent,
  updateDbStudentPayment,
  deleteDbStudent,
  insertDbPayment,
  updateDbSeatStatus,
  updateDbSettings,
  insertDbBooking,
  DbSeat,
  DbStudent,
  DbPayment,
  DbSettings
} from "@/lib/db";

export type Seat = { id: number; status: "available" | "occupied" | "reserved"; name?: string; zone: string };

export type Student = {
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

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  studentName: string;
  seat: string;
  amount: number;
  date: string;
  method: "UPI / GPay" | "Cash" | "Bank Transfer" | "Card";
  status: "Paid" | "Pending";
};

export type RoomSettings = {
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
};

const initialSeats: Seat[] = Array.from({ length: 32 }, (_, i) => ({
  id: i + 1,
  status: "available",
  name: undefined,
  zone: i < 16 ? "Quiet zone" : "Window side"
}));

const SQL_SETUP_SCRIPT = `-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eheijwnjkjbzkwyprpoj/sql

create extension if not exists "pgcrypto";

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null unique,
  area text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'occupied')),
  occupant_name text,
  monthly_fee numeric(10,2) not null default 1200,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  seat_number text,
  plan text not null default 'Full Day',
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'overdue')),
  amount numeric(10,2) not null default 1200,
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null unique,
  student_name text not null,
  seat_number text not null,
  amount numeric(10,2) not null default 1200,
  payment_date text not null default to_char(current_date, 'DD Mon YYYY'),
  payment_method text not null default 'UPI / GPay',
  status text not null default 'paid' check (status in ('paid', 'pending')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null,
  student_name text not null,
  email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.room_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Serenity Study Hall',
  tagline text not null default 'Reading Space & Dedicated Study Hall',
  address text not null default '4th Floor, Apex Tower, Near Central Library, Ernakulam',
  phone text not null default '+91 98470 11223',
  email text not null default 'contact@stillroom.space',
  open_time text not null default '06:00 AM',
  close_time text not null default '11:00 PM',
  monthly_fee numeric(10,2) not null default 1200,
  deposit numeric(10,2) not null default 500,
  locker_fee numeric(10,2) not null default 200,
  wifi_ssid text not null default 'Stillroom_HighSpeed_5G',
  wifi_pass text not null default 'focusquiet2024',
  updated_at timestamptz not null default now()
);

alter table public.seats enable row level security;
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.bookings enable row level security;
alter table public.room_settings enable row level security;

create policy "anon_seats" on public.seats for all using (true) with check (true);
create policy "anon_students" on public.students for all using (true) with check (true);
create policy "anon_payments" on public.payments for all using (true) with check (true);
create policy "anon_bookings" on public.bookings for all using (true) with check (true);
create policy "anon_settings" on public.room_settings for all using (true) with check (true);

-- Insert real desks
insert into public.seats (seat_number, area, status)
select
  case when i <= 16 then 'A-' || lpad(i::text, 2, '0') else 'B-' || lpad((i-16):text, 2, '0') end,
  case when i <= 16 then 'Quiet zone' else 'Window side' end,
  'available'
from generate_series(1, 32) as i
on conflict do nothing;

insert into public.room_settings (name, tagline) values ('Serenity Study Hall', 'Reading Space & Dedicated Study Hall') on conflict do nothing;`;

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [active, setActive] = useState<string>("Overview");
  const [toast, setToast] = useState<string>("");
  const [studentView, setStudentView] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Database Connection State
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "pending_setup">("checking");
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
  });

  // Filters
  const [studentQuery, setStudentQuery] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [seatFilter, setSeatFilter] = useState<"All" | "Available" | "Occupied" | "Reserved" | "Quiet" | "Window">("All");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "Paid" | "Pending">("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  // Sync with Supabase real data
  const syncWithSupabase = useCallback(async () => {
    setIsSyncing(true);
    const connection = await checkSupabaseConnection();

    if (!connection.connected || !connection.tablesExist) {
      setDbStatus("pending_setup");
      setIsSyncing(false);

      // Load cached local state if available
      try {
        const cachedStudents = localStorage.getItem("stillroom_students");
        const cachedPayments = localStorage.getItem("stillroom_payments");
        const cachedSettings = localStorage.getItem("stillroom_settings");
        if (cachedStudents) setStudentsList(JSON.parse(cachedStudents));
        if (cachedPayments) setPaymentsList(JSON.parse(cachedPayments));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));
      } catch {}
      return;
    }

    setDbStatus("connected");

    // 1. Fetch Real Seats
    const dbSeats = await getDbSeats();
    if (dbSeats && dbSeats.length > 0) {
      const mappedSeats: Seat[] = dbSeats.map((s, index) => {
        const num = parseInt(s.seat_number.replace(/[AB]-/, ""), 10) + (s.seat_number.startsWith("B") ? 16 : 0);
        return {
          id: isNaN(num) ? index + 1 : num,
          status: s.status,
          name: s.occupant_name || undefined,
          zone: s.area
        };
      });
      // Sort by desk ID 1-32
      mappedSeats.sort((a, b) => a.id - b.id);
      setSeats(mappedSeats);
    }

    // 2. Fetch Real Students
    const dbStudents = await getDbStudents();
    if (dbStudents) {
      const colors = ["sage", "peach", "lilac", "blue", "yellow"];
      const mappedStudents: Student[] = dbStudents.map((s, idx) => ({
        id: s.id || `st-${idx}`,
        name: s.full_name,
        initials: s.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ST",
        color: colors[idx % colors.length],
        seat: s.seat_number || "A-01",
        date: s.joined_at ? new Date(s.joined_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
        phone: s.phone || "+91 98000 00000",
        email: s.email || `${s.full_name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        payment: s.payment_status === "paid" ? "Paid" : "Pending",
        amount: Number(s.amount) || 1200,
        plan: (s.plan as any) || "Full Day",
      }));
      setStudentsList(mappedStudents);
    }

    // 3. Fetch Real Payments
    const dbPayments = await getDbPayments();
    if (dbPayments) {
      const mappedPayments: PaymentRecord[] = dbPayments.map((p, idx) => ({
        id: p.id || `tx-${idx}`,
        invoiceId: p.invoice_id,
        studentName: p.student_name,
        seat: p.seat_number,
        amount: Number(p.amount) || 1200,
        date: p.payment_date,
        method: (p.payment_method as any) || "UPI / GPay",
        status: p.status === "paid" ? "Paid" : "Pending"
      }));
      setPaymentsList(mappedPayments);
    }

    // 4. Fetch Real Settings
    const dbSettings = await getDbSettings();
    if (dbSettings) {
      setSettings({
        name: dbSettings.name || "Serenity Study Hall",
        tagline: dbSettings.tagline || "Reading Space & Dedicated Study Hall",
        address: dbSettings.address || "4th Floor, Apex Tower, Near Central Library, Ernakulam",
        phone: dbSettings.phone || "+91 98470 11223",
        email: dbSettings.email || "contact@stillroom.space",
        openTime: dbSettings.open_time || "06:00 AM",
        closeTime: dbSettings.close_time || "11:00 PM",
        monthlyFee: Number(dbSettings.monthly_fee) || 1200,
        deposit: Number(dbSettings.deposit) || 500,
        lockerFee: Number(dbSettings.locker_fee) || 200,
        wifiSSID: dbSettings.wifi_ssid || "Stillroom_HighSpeed_5G",
        wifiPass: dbSettings.wifi_pass || "focusquiet2024",
      });
    }

    setIsSyncing(false);
  }, []);

  useEffect(() => {
    // Theme initialization
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) as "dark" | "light" | null;
    const initial = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);

    // Initial Supabase Sync
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Save changes to localStorage as offline safety
  useEffect(() => {
    if (dbStatus !== "connected") {
      try {
        localStorage.setItem("stillroom_students", JSON.stringify(studentsList));
        localStorage.setItem("stillroom_payments", JSON.stringify(paymentsList));
        localStorage.setItem("stillroom_settings", JSON.stringify(settings));
      } catch {}
    }
  }, [studentsList, paymentsList, settings, dbStatus]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
    }
    document.documentElement.setAttribute("data-theme", next);
    notify(`Switched to ${next === "dark" ? "Dark" : "Light"} mode`);
  };

  const availableCount = seats.filter((seat) => seat.status === "available").length;
  const occupiedCount = seats.filter((seat) => seat.status === "occupied").length;
  const reservedCount = seats.filter((seat) => seat.status === "reserved").length;

  const totalCollected = paymentsList.filter(p => p.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
  const pendingDuesTotal = studentsList.filter(s => s.payment === "Pending").reduce((acc, curr) => acc + curr.amount, 0);

  // Toggle student payment status (Live Supabase Sync)
  const toggleStudentPayment = async (id: string) => {
    const student = studentsList.find(s => s.id === id);
    if (!student) return;

    const nextStatus = student.payment === "Paid" ? "Pending" : "Paid";
    setStudentsList(prev => prev.map(s => s.id === id ? { ...s, payment: nextStatus } : s));

    // Update in Supabase
    if (dbStatus === "connected" && !id.startsWith("st-")) {
      await updateDbStudentPayment(id, nextStatus === "Paid" ? "paid" : "pending");
    }

    notify(`Payment status for ${student.name} updated to ${nextStatus}`);
  };

  // Add new student (Live Supabase Sync)
  const handleAddStudent = async (e: React.FormEvent) => {
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

    const email = newStudentEmail || `${newStudentName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const phone = newStudentPhone || "+91 98000 00000";

    // 1. Insert in Supabase
    let realStudentId = `st-${Date.now()}`;
    if (dbStatus === "connected") {
      const res = await insertDbStudent({
        full_name: newStudentName,
        email,
        phone,
        seat_number: seatCode,
        plan: newStudentPlan,
        payment_status: "paid",
        amount: settings.monthlyFee,
      });
      if (res?.id) realStudentId = res.id;

      // Update seat in Supabase
      await updateDbSeatStatus(seatCode, "occupied", newStudentName);

      // Record initial payment in Supabase
      await insertDbPayment({
        invoice_id: `INV-2024-${String(paymentsList.length + 101).padStart(3, "0")}`,
        student_name: newStudentName,
        seat_number: seatCode,
        amount: settings.monthlyFee,
        payment_date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        payment_method: "UPI / GPay",
        status: "paid"
      });
    }

    // 2. Update local state
    const newStudent: Student = {
      id: realStudentId,
      name: newStudentName,
      initials: initials || "ST",
      color: randomColor,
      seat: seatCode,
      date: "Today",
      phone,
      email,
      payment: "Paid",
      amount: settings.monthlyFee,
      plan: newStudentPlan,
    };

    setStudentsList([newStudent, ...studentsList]);
    setSeats(prev => prev.map(s => s.id === assignedSeatNumber ? { ...s, status: "occupied", name: newStudentName } : s));

    const newTx: PaymentRecord = {
      id: `tx-${Date.now()}`,
      invoiceId: `INV-2024-${String(paymentsList.length + 101).padStart(3, "0")}`,
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
    notify(`Student ${newStudentName} registered and synced with database!`);
  };

  // Record payment (Live Supabase Sync)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;

    const student = studentsList.find(s => s.name === paymentStudent);
    const seatCode = student?.seat || "General";
    const invoiceId = `INV-2024-${String(paymentsList.length + 101).padStart(3, "0")}`;
    const todayStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

    if (dbStatus === "connected") {
      await insertDbPayment({
        invoice_id: invoiceId,
        student_name: paymentStudent,
        seat_number: seatCode,
        amount: paymentAmount,
        payment_date: todayStr,
        payment_method: paymentMethod,
        status: "paid"
      });

      if (student && !student.id.startsWith("st-")) {
        await updateDbStudentPayment(student.id, "paid");
      }
    }

    const newTx: PaymentRecord = {
      id: `tx-${Date.now()}`,
      invoiceId,
      studentName: paymentStudent,
      seat: seatCode,
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
    notify(`Payment of ₹${paymentAmount} recorded and synced!`);
  };

  // Vacate seat (Live Supabase Sync)
  const handleVacateSeat = async (seatId: number) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return;
    const seatCode = `${seat.id <= 16 ? "A" : "B"}-${String((seat.id - 1) % 16 + 1).padStart(2, "0")}`;
    const seatName = seat.name;

    if (dbStatus === "connected") {
      await updateDbSeatStatus(seatCode, "available", null);
      const student = studentsList.find(s => s.name === seatName);
      if (student && !student.id.startsWith("st-")) {
        await deleteDbStudent(student.id);
      }
    }

    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: "available", name: undefined } : s));
    if (seatName) {
      setStudentsList(prev => prev.filter(s => s.name !== seatName));
    }
    setInspectSeat(null);
    notify(`Desk ${seatCode} is now released and available in the database.`);
  };

  // Save Settings (Live Supabase Sync)
  const handleSaveSettings = async () => {
    if (dbStatus === "connected") {
      await updateDbSettings({
        name: settings.name,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        open_time: settings.openTime,
        close_time: settings.closeTime,
        monthly_fee: settings.monthlyFee,
        deposit: settings.deposit,
        locker_fee: settings.lockerFee,
        wifi_ssid: settings.wifiSSID,
        wifi_pass: settings.wifiPass,
      });
    }
    notify("Preferences saved and synchronized with database!");
  };

  // Student portal booking (Live Supabase Sync)
  const handleStudentPortalReserve = async (seat: Seat) => {
    const seatCode = `${seat.id <= 16 ? "A" : "B"}-${String((seat.id - 1) % 16 + 1).padStart(2, "0")}`;

    if (dbStatus === "connected") {
      await insertDbBooking({
        seat_number: seatCode,
        student_name: "Prospective Student",
        email: "guest.student@gmail.com"
      });
      await updateDbSeatStatus(seatCode, "reserved", "Reserved Online");
    }

    setSeats(prev => prev.map(s => s.id === seat.id ? { ...s, status: "reserved" } : s));
    setStudentView(false);
    notify(`Booking request for Desk ${seatCode} received and logged!`);
  };

  if (studentView) {
    return (
      <StudentPortal
        seats={seats}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => setStudentView(false)}
        onSelect={(seat) => handleStudentPortalReserve(seat)}
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
              onClick={() => { setActive(label); }}
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

          {/* DATABASE SYNC PILL */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {dbStatus === "connected" ? (
              <button
                className="pill-btn"
                onClick={syncWithSupabase}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  background: "var(--emerald-lo)",
                  color: "var(--emerald)"
                }}
                title="Connected to Supabase live database. Click to re-sync."
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)" }} />
                <span>Supabase Live DB</span>
                <RefreshCw size={11} className={isSyncing ? "spin-icon" : ""} />
              </button>
            ) : (
              <button
                className="pill-btn"
                onClick={() => setShowSqlModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderColor: "rgba(245, 158, 11, 0.4)",
                  background: "var(--amber-lo)",
                  color: "var(--amber)"
                }}
                title="Click to run 1-Click SQL Setup in Supabase"
              >
                <AlertTriangle size={12} />
                <span>Setup Supabase Tables</span>
              </button>
            )}
          </div>

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

            <button className="icon-btn notification" onClick={() => notify("All notifications cleared.")} title="Notifications">
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
                  <div className="stat-value">{studentsList.length} <span className="stat-trend"><ArrowUpRight size={13} /> Active</span></div>
                  <div className="stat-foot">Registered readers <span>Real data</span></div>
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
                    <button className="more-button" onClick={() => notify("Activity synchronized")}>
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
                      <div><strong>{occupiedCount}</strong><span>Occupied</span></div>
                      <div><strong>{availableCount}</strong><span>Available</span></div>
                    </div>
                    <div className="checkin-avatars">
                      <div className="mini-avatar sage">ST</div>
                      <div className="mini-avatar blue">DS</div>
                      <div className="mini-avatar lilac">IR</div>
                      <div className="mini-avatar peach">MK</div>
                      <div className="mini-avatar muted-avatar">+{occupiedCount}</div>
                      <span>live readers in room</span>
                    </div>
                  </div>

                  <div className="activity-heading">
                    <h3>Recent updates</h3>
                    <button onClick={() => setActive("Students")}>See all</button>
                  </div>

                  <div className="activity-list">
                    <Activity color="sage" initials="DB" title="Database Status" detail={dbStatus === "connected" ? "Synchronized with Supabase" : "Local mode (Tables pending)"} time="Now" />
                    <Activity color="blue" initials="✓" title="Check-in registered" detail="Hall operating at normal capacity" time="Today" />
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
                  {studentsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                      <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p>No students enrolled yet. Click <strong>+ Add Student</strong> to admit your first reader.</p>
                    </div>
                  ) : (
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
                  )}
                </div>

                {studentsList.length > 5 && (
                  <button className="all-students" onClick={() => setActive("Students")}>
                    Open full students directory ({studentsList.length}) <ArrowUpRight size={14} />
                  </button>
                )}
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
                    <p className="view-desc">Live member records connected directly to your database.</p>
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
                  {studentsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                      <Users size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                      <strong style={{ display: "block", color: "var(--ink)", marginBottom: 4 }}>No Students Found</strong>
                      <p style={{ fontSize: 12 }}>Click <strong>+ Add New Student</strong> above to register your first member.</p>
                    </div>
                  ) : (
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
                                      if (confirm(`Remove student ${student.name}? This will free up desk ${student.seat}.`)) {
                                        const seatNum = parseInt(student.seat.replace(/[AB]-/, ""), 10) + (student.seat.startsWith("B") ? 16 : 0);
                                        handleVacateSeat(seatNum);
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
                  )}
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
                    <p className="view-desc">Live desk layout with zone controls, vacancy inspection, and allocation.</p>
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
                      <span className="map-note">Click any desk icon to inspect reader details or reassign</span>
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
                              const seatCode = `${inspectSeat.id <= 16 ? "A" : "B"}-${String((inspectSeat.id - 1) % 16 + 1).padStart(2, "0")}`;
                              if (dbStatus === "connected") {
                                updateDbSeatStatus(seatCode, "available", null);
                              }
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
                  {paymentsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                      <CreditCard size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                      <strong style={{ display: "block", color: "var(--ink)", marginBottom: 4 }}>No Transactions Yet</strong>
                      <p style={{ fontSize: 12 }}>Click <strong>+ Record Payment</strong> to log fees or admissions.</p>
                    </div>
                  ) : (
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
                  )}
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
                      onClick={handleSaveSettings}
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
                    onClick={handleSaveSettings}
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
                    q: "How does the real Supabase database connection work?",
                    a: "The dashboard is connected to your Supabase project (eheijwnjkjbzkwyprpoj.supabase.co). Once you run the SQL script in your Supabase dashboard, all real student admissions, desk assignments, and payment invoices sync automatically."
                  },
                  {
                    q: "How do I allocate or change a student's seat?",
                    a: "Go to 'Seat map', click on any available desk (green), and click 'Assign to Student'. Alternatively, from the 'Students' page, click 'Add New Student' and pick a desk."
                  },
                  {
                    q: "How do I mark pending fee payments as paid?",
                    a: "You can simply click directly on the 'Pending' badge in the Students or Payments table. It will instantly toggle to 'Paid' in both the view and your database."
                  },
                  {
                    q: "What happens when a student vacates their desk?",
                    a: "Go to the Seat Map, click on their desk, and choose 'Vacate / Release Desk'. The desk will immediately become green (available) and ready for a new student."
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

      {/* ================= MODAL: SQL SETUP ================= */}
      {showSqlModal && (
        <div className="modal-backdrop" onClick={() => setShowSqlModal(false)}>
          <div className="booking-modal" style={{ width: "min(680px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSqlModal(false)}><X size={18} /></button>
            <div className="modal-icon"><Database size={21} /></div>
            <div className="section-kicker">SUPABASE DATABASE SETUP</div>
            <h2>Initialize Database Tables</h2>
            <p style={{ marginBottom: 14 }}>
              Your Supabase project (<strong>eheijwnjkjbzkwyprpoj.supabase.co</strong>) is configured. Run this SQL script once in your Supabase dashboard to create the tables.
            </p>

            <div style={{ background: "var(--inset-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>SQL SCHEMA (schema.sql)</span>
                <button
                  className="action-btn-ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(SQL_SETUP_SCRIPT);
                    notify("SQL script copied to clipboard!");
                  }}
                >
                  <Copy size={13} /> Copy SQL
                </button>
              </div>
              <pre style={{
                maxHeight: 180,
                overflow: "auto",
                fontSize: 10,
                fontFamily: "monospace",
                color: "var(--ink)",
                whiteSpace: "pre-wrap",
                background: "var(--chip-bg)",
                padding: 10,
                borderRadius: 6
              }}>
                {SQL_SETUP_SCRIPT}
              </pre>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <a
                href="https://supabase.com/dashboard/project/eheijwnjkjbzkwyprpoj/sql/new"
                target="_blank"
                rel="noreferrer"
                className="action-btn-primary"
                onClick={() => {
                  navigator.clipboard?.writeText(SQL_SETUP_SCRIPT);
                  notify("SQL copied! Opening Supabase SQL Editor...");
                }}
              >
                Open Supabase SQL Editor <ExternalLink size={14} />
              </a>
              <button
                className="action-btn-secondary"
                onClick={() => {
                  setShowSqlModal(false);
                  syncWithSupabase();
                }}
              >
                Check Sync Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="modal-backdrop" onClick={() => setShowAddStudentModal(false)}>
          <form className="booking-modal" onSubmit={handleAddStudent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowAddStudentModal(false)}><X size={18} /></button>
            <div className="modal-icon"><Users size={21} /></div>
            <div className="section-kicker">NEW ADMISSION</div>
            <h2>Register Student</h2>
            <p>Add a new reader and assign their dedicated study desk in the database.</p>

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
            <p>Log a monthly subscription payment directly into your database.</p>

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
