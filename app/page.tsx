"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, CreditCard, LayoutDashboard, LogOut, MoreHorizontal, Plus, Search, Settings, SlidersHorizontal, Users, X } from "lucide-react";

type Seat = { id: number; status: "available" | "occupied" | "reserved"; name?: string; zone: string };
const initialSeats: Seat[] = Array.from({ length: 32 }, (_, i) => {
  const occupied: Record<number, string> = { 2: "Aarav M.", 3: "Diya S.", 5: "Ishaan R.", 8: "Meera K.", 9: "Rohan P.", 13: "Anaya J.", 14: "Kabir V.", 18: "Sana A.", 19: "Arjun D.", 22: "Nisha T.", 26: "Vivaan B.", 27: "Tara N." };
  const reserved = [6, 16, 30];
  return { id: i + 1, status: occupied[i + 1] ? "occupied" : reserved.includes(i + 1) ? "reserved" : "available", name: occupied[i + 1], zone: i < 16 ? "Quiet zone" : "Window side" };
});

const students = [
  { name: "Aarav Mehta", initials: "AM", color: "sage", seat: "A-02", date: "12 Oct 2024", payment: "Paid" },
  { name: "Diya Shah", initials: "DS", color: "peach", seat: "A-03", date: "08 Oct 2024", payment: "Pending" },
  { name: "Ishaan Rao", initials: "IR", color: "lilac", seat: "A-05", date: "05 Oct 2024", payment: "Paid" },
  { name: "Meera Kapoor", initials: "MK", color: "blue", seat: "A-08", date: "01 Oct 2024", payment: "Paid" },
];

export default function Home() {
  const [seats, setSeats] = useState(initialSeats);
  const [active, setActive] = useState("Overview");
  const [selected, setSelected] = useState<Seat | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [studentView, setStudentView] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const available = seats.filter((seat) => seat.status === "available").length;
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const reserve = () => {
    if (!selected) return;
    setSeats((items) => items.map((seat) => seat.id === selected.id ? { ...seat, status: "reserved" } : seat));
    setSelected(null); setStudentView(false); notify("Booking request sent to the reading room admin");
  };

  if (studentView) return <StudentPortal seats={seats} onBack={() => setStudentView(false)} onSelect={(seat) => { setSelected(seat); setStudentView(false); }} />;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><BookOpen size={20} strokeWidth={1.8}/></div><div><strong>stillroom</strong><span>READING SPACE</span></div></div>
      <div className="workspace"><div className="workspace-icon">S</div><div className="workspace-name"><strong>Serenity Study Hall</strong><span>Admin workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="navigation">
        {[[LayoutDashboard,"Overview"],[Users,"Students"],[BookOpen,"Seat map"],[CreditCard,"Payments"]].map(([Icon,label]: any) => <button className={`nav-item ${active === label ? "active" : ""}`} key={label} onClick={() => { setActive(label); if (label !== "Overview") notify(`${label} view selected`); }}><Icon size={18} strokeWidth={1.8}/><span>{label}</span>{label === "Payments" && <i className="nav-count">3</i>}</button>)}
      </nav>
      <div className="nav-label tools-label">PREFERENCES</div>
      <nav className="navigation"><button className="nav-item" onClick={() => notify("Settings are coming soon")}><Settings size={18}/><span>Settings</span></button><button className="nav-item" onClick={() => notify("Help center is coming soon")}><CircleHelp size={18}/><span>Help center</span></button></nav>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-top"><span className="plan-dot"/> YOUR SPACE <span className="plan-live">LIVE</span></div><strong>Looking good, Sara ✨</strong><p>Your reading room is 78% full. Keep the quiet going.</p><div className="progress"><i/></div><small>25 of 32 seats occupied</small></div><button className="profile"><div className="avatar admin-avatar">SP</div><div className="profile-meta"><strong>Sara Patel</strong><span>Administrator</span></div><MoreHorizontal size={19}/></button></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>{active}</strong></div><div className="top-actions"><button className="icon-btn search-trigger" onClick={() => document.getElementById("student-search")?.focus()}><Search size={18}/></button><button className="icon-btn notification" onClick={() => notify("You're all caught up!")}><Bell size={18}/><i/></button><div className="top-divider"/><button className="view-switch" onClick={() => setStudentView(true)}><span className="view-dot"/> Student view <ArrowUpRight size={14}/></button></div></header>
      <div className="content">
        <div className="welcome-row"><div><div className="eyebrow"><span/> TUESDAY, OCTOBER 29, 2024</div><h1>A little room to <em>focus.</em></h1><p className="welcome-copy">Here’s what’s happening at your reading room today.</p></div><button className="invite-button" onClick={() => notify("Invite link copied — share it with a new student!")}><Plus size={17}/> Invite a student <ArrowUpRight size={15}/></button></div>
        <div className="stats-grid">
          <article className="stat-card"><div className="stat-head"><span>Total students</span><span className="stat-icon green"><Users size={17}/></span></div><div className="stat-value">25 <span className="stat-trend"><ArrowUpRight size={13}/> 12%</span></div><div className="stat-foot">vs. last month <span>+3 students</span></div><div className="sparkline green-line"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M0 25 C15 24 15 19 28 20 S44 12 55 16 S72 6 83 11 S104 3 120 4"/></svg></div></article>
          <article className="stat-card"><div className="stat-head"><span>Seats available</span><span className="stat-icon blue"><LayoutDashboard size={17}/></span></div><div className="stat-value">{available}<span className="stat-denom"> / 32</span></div><div className="stat-foot"><span className="inline-dot green-dot"/> Ready for new readers</div><div className="seat-meter"><span style={{width:`${(25/32)*100}%`}}/></div></article>
          <article className="stat-card"><div className="stat-head"><span>Collected this month</span><span className="stat-icon yellow"><CreditCard size={17}/></span></div><div className="stat-value">₹28,800</div><div className="stat-foot">of ₹30,000 expected <span className="positive-text">96%</span></div><div className="sparkline gold-line"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M0 26 C15 25 20 18 33 21 S48 13 60 16 S80 8 91 12 S108 2 120 3"/></svg></div></article>
          <article className="stat-card dues-card"><div className="stat-head"><span>Pending dues</span><span className="stat-icon coral"><Clock3 size={17}/></span></div><div className="stat-value">₹1,200</div><div className="stat-foot"><span className="inline-dot coral-dot"/> 1 student payment due</div><button className="text-link" onClick={() => setActive("Payments")}>Review payments <ArrowUpRight size={13}/></button></article>
        </div>
        <div className="dashboard-grid">
          <section className="panel seat-panel"><div className="panel-heading"><div><div className="section-kicker">YOUR SPACE</div><h2>Seat map <span className="live-pill"><i/> LIVE</span></h2></div><button className="filter-button" onClick={() => notify("Showing all reading zones")}><SlidersHorizontal size={15}/> All areas <ChevronDown size={14}/></button></div>
            <div className="map-summary"><div><span className="summary-large">{available}</span><span className="summary-caption">seats open to book</span></div><div className="legend"><span><i className="legend-open"/> Available</span><span><i className="legend-taken"/> Occupied</span><span><i className="legend-held"/> Reserved</span></div></div>
            <div className="floor-plan"><div className="zone-label"><span>01</span><i/> QUIET ZONE <small>· 16 seats</small></div><div className="seat-grid">{seats.slice(0,16).map((seat) => <SeatButton key={seat.id} seat={seat} onClick={() => seat.status === "available" ? setSelected(seat) : notify(seat.name ? `Seat ${seat.id} is occupied by ${seat.name}` : `Seat ${seat.id} is reserved`)}/>)}</div><div className="zone-divider"><span>glass partition</span></div><div className="zone-label window-label"><span>02</span><i/> WINDOW SIDE <small>· 16 seats</small></div><div className="seat-grid">{seats.slice(16).map((seat) => <SeatButton key={seat.id} seat={seat} onClick={() => seat.status === "available" ? setSelected(seat) : notify(seat.name ? `Seat ${seat.id} is occupied by ${seat.name}` : `Seat ${seat.id} is reserved`)}/>)}</div><div className="map-bottom"><span><i/> Entrance</span><span className="map-note">Select an available seat to reserve it</span><span className="map-scale">NOT TO SCALE</span></div></div>
          </section>
          <section className="panel activity-panel"><div className="panel-heading"><div><div className="section-kicker">A QUICK LOOK</div><h2>Today at a glance</h2></div><button className="more-button" onClick={() => notify("All activity is up to date")}><MoreHorizontal size={20}/></button></div><div className="day-card"><div className="day-card-top"><CalendarDays size={16}/><span>TUESDAY, 29 OCT</span><span className="day-now">TODAY</span></div><div className="day-stats"><div><strong>18</strong><span>Checked in</span></div><div><strong>07</strong><span>Yet to arrive</span></div></div><div className="checkin-avatars"><div className="mini-avatar sage">AM</div><div className="mini-avatar peach">DS</div><div className="mini-avatar lilac">IR</div><div className="mini-avatar blue">MK</div><div className="mini-avatar muted-avatar">+14</div><span>and 14 others checked in</span></div></div><div className="activity-heading"><h3>Recent activity</h3><button onClick={() => notify("You’re viewing the latest activity")}>See all</button></div><div className="activity-list"><Activity color="peach" initials="DS" title="Payment reminder" detail="Diya Shah · ₹1,200 due" time="9:42 AM"/><Activity color="sage" initials="+" title="New booking request" detail="Priya Nair · Seat B-06" time="9:18 AM"/><Activity color="blue" initials="✓" title="Checked in" detail="Meera Kapoor · Seat A-08" time="8:56 AM"/><Activity color="lilac" initials="₹" title="Payment received" detail="Aarav Mehta · ₹1,200" time="Yesterday"/></div><button className="view-activity" onClick={() => setActive("Students")}>View all activity <ArrowUpRight size={14}/></button></section>
        </div>
        <section className="panel students-panel"><div className="panel-heading students-heading"><div><div className="section-kicker">YOUR COMMUNITY</div><h2>Recently joined <span className="student-count">25 students</span></h2></div><div className="table-tools"><div className="search-box"><Search size={15}/><input id="student-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a student"/></div><button className="filter-button table-filter" onClick={() => notify("Showing all payment statuses")}><SlidersHorizontal size={14}/> Filter</button><button className="table-more" onClick={() => setShowAll(!showAll)}><MoreHorizontal size={19}/></button></div></div><div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>SEAT</th><th>JOINED</th><th>PAYMENT STATUS</th><th></th></tr></thead><tbody>{(showAll ? [...students, {name:"Rohan Patel",initials:"RP",color:"yellow",seat:"B-03",date:"28 Sep 2024",payment:"Paid"}] : students).filter((student) => student.name.toLowerCase().includes(query.toLowerCase())).map((student) => <tr key={student.name}><td><div className="student-cell"><div className={`avatar ${student.color}`}>{student.initials}</div><strong>{student.name}</strong></div></td><td><span className="seat-code">{student.seat}</span></td><td>{student.date}</td><td><span className={`payment-badge ${student.payment === "Paid" ? "paid" : "pending"}`}><i/>{student.payment}</span></td><td><button className="row-menu" onClick={() => notify(`Options for ${student.name}`)}><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div><button className="all-students" onClick={() => {setShowAll(!showAll); setActive("Students")}}>{showAll ? "Show recent students" : "View all students"} <ArrowUpRight size={14}/></button></section>
        <footer className="footer"><span>Made for slower mornings and better ideas <span className="footer-spark">✳</span></span><span>stillroom · Serenity Study Hall</span></footer>
      </div>
    </section>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><form className="booking-modal" onSubmit={(e) => { e.preventDefault(); reserve(); }} onClick={(e) => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setSelected(null)}><X size={18}/></button><div className="modal-icon"><BookOpen size={21}/></div><div className="section-kicker">A PLACE FOR YOURSELF</div><h2>Seat {selected.id < 17 ? "A" : "B"}-{String((selected.id - 1) % 16 + 1).padStart(2,"0")}</h2><p>{selected.zone} · ₹1,200 / month</p><div className="modal-field"><label htmlFor="booking-name">STUDENT NAME</label><input id="booking-name" required value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Priya Nair"/></div><div className="modal-field"><label htmlFor="booking-email">EMAIL ADDRESS</label><input id="booking-email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="you@example.com" type="email"/></div><button type="submit" className="invite-button modal-submit">Request this seat <ArrowUpRight size={15}/></button><small>Your request will be sent to the reading room admin.</small></form></div>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </main>;
}

function StudentPortal({ seats, onBack, onSelect }: { seats: Seat[]; onBack: () => void; onSelect: (seat: Seat) => void }) {
  const available = seats.filter((seat) => seat.status === "available").length;
  return <main className="student-portal">
    <header className="student-header"><a className="brand" href="#"><div className="brand-mark"><BookOpen size={20}/></div><div><strong>stillroom</strong><span>READING SPACE</span></div></a><button className="view-switch" onClick={onBack}>Admin preview <ArrowUpRight size={14}/></button></header>
    <section className="student-hero"><div className="student-intro"><div className="eyebrow"><span/> SERENITY STUDY HALL · MEMBERSHIP</div><h1>Find your little <em>corner.</em></h1><p>Choose a seat that feels right. We’ll confirm your booking shortly.</p><div className="student-availability"><span className="availability-dot"/><strong>{available} seats available</strong><span>· ₹1,200 / month</span></div></div><div className="student-note"><BookOpen size={19}/><strong>A calmer place to focus</strong><span>Quiet study zones, welcoming people, and a seat that’s yours.</span></div></section>
    <section className="student-map-panel"><div className="panel-heading"><div><div className="section-kicker">PICK YOUR PREFERRED SEAT</div><h2>Reading room floor plan</h2></div><div className="legend"><span><i className="legend-open"/> Available</span><span><i className="legend-taken"/> Occupied</span><span><i className="legend-held"/> Reserved</span></div></div><div className="student-floor-plan"><div className="zone-label"><span>01</span><i/> QUIET ZONE <small>· 16 seats</small></div><div className="seat-grid">{seats.slice(0,16).map((seat) => <SeatButton key={seat.id} seat={seat} onClick={() => seat.status === "available" && onSelect(seat)}/>)}</div><div className="zone-divider"><span>glass partition</span></div><div className="zone-label"><span>02</span><i/> WINDOW SIDE <small>· 16 seats</small></div><div className="seat-grid">{seats.slice(16).map((seat) => <SeatButton key={seat.id} seat={seat} onClick={() => seat.status === "available" && onSelect(seat)}/>)}</div><div className="map-bottom"><span><i/> Entrance</span><span className="map-note">Choose any available seat to request it</span><span className="map-scale">NOT TO SCALE</span></div></div></section>
    <footer className="student-footer">Questions? Contact Serenity Study Hall · Membership requests are confirmed by the room admin.</footer>
  </main>;
}

function SeatButton({seat, onClick}:{seat:Seat;onClick:()=>void}) { return <button onClick={onClick} disabled={seat.status !== "available"} className={`seat ${seat.status}`} aria-label={`Seat ${seat.id < 17 ? "A" : "B"}-${String((seat.id - 1) % 16 + 1).padStart(2,"0")}, ${seat.status}${seat.name ? `, ${seat.name}` : ""}`} title={seat.status === "occupied" ? `Occupied by ${seat.name ?? "a student"}` : seat.status}>{seat.status === "occupied" ? <span className="seat-person">{seat.name?.split(" ").map((x)=>x[0]).join("")}</span> : seat.status === "reserved" ? <Clock3 size={13}/> : <span>{String(seat.id < 17 ? seat.id : seat.id - 16).padStart(2,"0")}</span>}</button>; }
function Activity({color, initials, title, detail, time}:{color:string;initials:string;title:string;detail:string;time:string}) { return <div className="activity-item"><div className={`activity-icon ${color}`}>{initials}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>; }
