import { supabase } from "./supabase";

export type DbSeat = {
  id?: string;
  seat_number: string;
  area: string;
  status: "available" | "reserved" | "occupied";
  occupant_name?: string | null;
  monthly_fee: number;
};

export type DbStudent = {
  id?: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  seat_number?: string | null;
  plan: string;
  payment_status: "paid" | "pending" | "overdue";
  amount: number;
  joined_at?: string;
};

export type DbPayment = {
  id?: string;
  invoice_id: string;
  student_name: string;
  seat_number: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: "paid" | "pending";
};

export type DbSettings = {
  id?: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  open_time: string;
  close_time: string;
  monthly_fee: number;
  deposit: number;
  locker_fee: number;
  wifi_ssid: string;
  wifi_pass: string;
};

// Check if Supabase is connected and tables exist
export async function checkSupabaseConnection(): Promise<{ connected: boolean; tablesExist: boolean; error?: string }> {
  if (!supabase) {
    return { connected: false, tablesExist: false, error: "Supabase client not initialized (check .env.local)" };
  }

  try {
    const { data, error } = await supabase.from("seats").select("id").limit(1);
    if (error) {
      if (error.code === "PGRST205") {
        return { connected: true, tablesExist: false, error: "Tables not created yet in Supabase" };
      }
      return { connected: true, tablesExist: false, error: error.message };
    }
    return { connected: true, tablesExist: true };
  } catch (err: any) {
    return { connected: false, tablesExist: false, error: err?.message || "Connection error" };
  }
}

// 1. SEATS
export async function getDbSeats(): Promise<DbSeat[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("seats").select("*").order("seat_number", { ascending: true });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateDbSeatStatus(seatNumber: string, status: "available" | "reserved" | "occupied", occupantName?: string | null) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("seats")
      .update({ status, occupant_name: occupantName || null })
      .eq("seat_number", seatNumber);
    return !error;
  } catch {
    return false;
  }
}

// 2. STUDENTS
export async function getDbStudents(): Promise<DbStudent[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function insertDbStudent(student: DbStudent) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("students").insert([student]).select().single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateDbStudentPayment(id: string, payment_status: "paid" | "pending" | "overdue") {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("students").update({ payment_status }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDbStudent(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("students").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

// 3. PAYMENTS
export async function getDbPayments(): Promise<DbPayment[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function insertDbPayment(payment: DbPayment) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("payments").insert([payment]).select().single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// 4. SETTINGS
export async function getDbSettings(): Promise<DbSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("room_settings").select("*").limit(1).single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateDbSettings(settings: Partial<DbSettings>) {
  if (!supabase) return false;
  try {
    const { data } = await supabase.from("room_settings").select("id").limit(1).single();
    if (data?.id) {
      const { error } = await supabase.from("room_settings").update(settings).eq("id", data.id);
      return !error;
    } else {
      const { error } = await supabase.from("room_settings").insert([settings]);
      return !error;
    }
  } catch {
    return false;
  }
}

// 5. BOOKINGS
export async function insertDbBooking(booking: { seat_number: string; student_name: string; email: string; phone?: string }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("bookings").insert([booking]).select().single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
