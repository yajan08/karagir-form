"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Phone, CheckCircle, Search, Trophy, Loader2, ArrowLeft, Trash2, AlertTriangle, X, Lock, Download, Calendar, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Registration {
  id: string;
  registration_id: string;
  full_name: string;
  phone_number: string;
  village: string; // Added village
  guests_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const ADMIN_PASSWORD = "admin112"; // Using the password from the existing code
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(""); // For date filtering
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // For sorting
  const [winner, setWinner] = useState<Registration | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_authed");
    if (cached === "true") {
      setIsAuthed(true);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchRegistrations();
    }
  }, [isAuthed]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthed(true);
      setAuthError("");
      sessionStorage.setItem("admin_authed", "true");
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const fetchRegistrations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: sortOrder === 'asc' });

    if (!error && data) {
      setRegistrations(data);
    }
    setIsLoading(false);
  };

  // Re-fetch when sort order changes
  useEffect(() => {
    if (isAuthed) fetchRegistrations();
  }, [sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const exportToCSV = () => {
    const dataToExport = filteredRegistrations;
    if (dataToExport.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }

    const headers = ["Registration ID", "Full Name", "Phone Number", "Village", "Guests", "Registered At"];
    const rows = dataToExport.map(reg => [
      reg.registration_id,
      reg.full_name,
      reg.phone_number,
      reg.village || "",
      reg.guests_count,
      new Date(reg.created_at).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations_${selectedDate || 'all'}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pickRandomWinner = () => {
    if (registrations.length === 0) return;

    setIsPicking(true);
    setWinner(null);

    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * registrations.length);
      setWinner(registrations[randomIndex]);
      count++;

      if (count > 20) {
        clearInterval(interval);
        setIsPicking(false);
        const finalWinner = registrations[Math.floor(Math.random() * registrations.length)];
        setWinner(finalWinner);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d96f27", "#8b2323", "#c39b4b"]
        });
      }
    }, 100);
  };

  const deleteAllRegistrations = async () => {
    setIsDeleting(true);
    const { error } = await supabase
      .from("registrations")
      .delete()
      .neq("registration_id", "");

    if (!error) {
      setRegistrations([]);
      setWinner(null);
      setShowDeleteModal(false);
    } else {
      alert("Error deleting registrations: " + error.message);
    }
    setIsDeleting(false);
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.registration_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.phone_number.includes(searchQuery) ||
      (reg.village && reg.village.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDate = !selectedDate || new Date(reg.created_at).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesDate;
  });

  const totalGuests = filteredRegistrations.reduce((sum, reg) => sum + reg.guests_count, 0);

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] border border-[#e5dcd1] shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-maroon/10 text-brand-maroon flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-brand-brown tracking-tight">Admin Access</h1>
            <p className="text-xs text-brand-brown/60 font-medium mt-1">Enter the admin password to continue.</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-maroon ml-2 uppercase tracking-[0.2em]">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#e5dcd1] bg-brand-cream/40 text-brand-brown font-bold text-sm focus:bg-white focus:ring-8 focus:ring-brand-maroon/5 focus:border-brand-maroon transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100">
                {authError}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-br from-brand-maroon to-brand-brown text-white font-black py-4 rounded-2xl hover:brightness-110 transition-all active:scale-[0.98] shadow-xl"
            >
              Enter Dashboard
            </button>
            <div className="text-center">
              <Link href="/" className="text-[10px] font-bold text-brand-brown/50 hover:text-brand-brown transition-all uppercase tracking-widest">
                Back to Registration
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader2 className="w-10 h-10 animate-spin text-brand-maroon" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#e5dcd1] sticky top-0 z-30 shadow-sm px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-brand-cream rounded-full transition-colors text-brand-maroon">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-black text-brand-brown tracking-tight">Admin Dashboard</h1>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/40" />
              <input
                type="text"
                placeholder="Search attendee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-brand-cream/50 border border-[#e5dcd1] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all w-48 sm:w-64"
              />
            </div>

            {/* Date Picker Filter */}
            <div className="relative flex items-center gap-2 px-3 py-2 bg-brand-cream/50 border border-[#e5dcd1] rounded-full">
              <Calendar className="w-4 h-4 text-brand-maroon" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-none"
                title="Filter by Date"
              />
              {selectedDate && (
                <button onClick={() => setSelectedDate("")} className="text-brand-brown/40 hover:text-brand-brown">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-[#e5dcd1] text-brand-brown px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-cream transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-brand-maroon" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={pickRandomWinner}
              disabled={isPicking || registrations.length === 0}
              className="flex items-center gap-2 bg-brand-maroon text-white px-5 py-2 rounded-full text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-maroon/20 disabled:opacity-50"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">{isPicking ? "Picking..." : "Pick Winner"}</span>
              <span className="sm:hidden">{isPicking ? "..." : <Trophy className="w-4 h-4"/>}</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all border border-red-100"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* Winner Banner */}
        {winner && (
          <div className="mb-10 animate-in zoom-in duration-500">
            <div className="relative bg-gradient-to-r from-brand-maroon to-brand-brown rounded-3xl p-8 text-white overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange rounded-full mix-blend-overlay filter blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <Trophy className="w-16 h-16 text-brand-gold mb-4 animate-bounce" />
                <h2 className="text-sm font-black tracking-[0.3em] uppercase mb-2 text-brand-gold">Luck Winner Selected</h2>
                <p className="text-4xl font-black mb-1">{winner.full_name}</p>
                <p className="text-brand-gold font-mono font-bold text-xl mb-4">{winner.registration_id}</p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-white/70">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {winner.phone_number}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {winner.village || "N/A"}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {winner.guests_count} Guests</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-[#e5dcd1] shadow-sm">
            <p className="text-brand-brown/50 text-xs font-bold uppercase tracking-widest mb-1">
              {selectedDate ? "Registrations Today" : "Total Registrations"}
            </p>
            <p className="text-4xl font-black text-brand-maroon">{filteredRegistrations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#e5dcd1] shadow-sm">
            <p className="text-brand-brown/50 text-xs font-bold uppercase tracking-widest mb-1">
              {selectedDate ? "Attendees Today" : "Total Attendees"}
            </p>
            <p className="text-4xl font-black text-brand-orange">{totalGuests}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#e5dcd1] shadow-sm">
            <p className="text-brand-brown/50 text-xs font-bold uppercase tracking-widest mb-1">System Status</p>
            <p className="text-xl font-black text-green-600 flex items-center gap-2 mt-2">
              <CheckCircle className="w-6 h-6" /> Live
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] border border-[#e5dcd1] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-cream/50 border-b border-[#e5dcd1]">
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60">ID</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60">Name</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60">Phone</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60">Village</th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60">Guests</th>
                  <th 
                    className="px-6 py-5 text-xs font-black uppercase tracking-widest text-brand-brown/60 cursor-pointer hover:bg-brand-cream/80 transition-colors"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center gap-2">
                      Registered At
                      {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5dcd1]">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="px-6 py-5 font-mono font-bold text-brand-maroon">{reg.registration_id}</td>
                    <td className="px-6 py-5 font-bold text-brand-brown">{reg.full_name}</td>
                    <td className="px-6 py-5 text-sm text-brand-brown/70">{reg.phone_number}</td>
                    <td className="px-6 py-5 text-sm text-brand-brown/70">{reg.village || "—"}</td>
                    <td className="px-6 py-5">
                      <span className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[10px] font-bold">
                        {reg.guests_count} {reg.guests_count === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-brand-brown/50">
                      {new Date(reg.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-brand-brown/40 font-medium italic">
                      No registrations found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-brown/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-[#e5dcd1] animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-brand-cream rounded-full transition-colors text-brand-brown/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-black text-brand-brown mb-2 tracking-tight">Delete All Data?</h3>
            <p className="text-brand-brown/60 text-sm font-medium mb-8 leading-relaxed">
              This will permanently delete all <span className="text-red-600 font-bold">{registrations.length}</span> registrations from the database. This action cannot be undone.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={deleteAllRegistrations}
                disabled={isDeleting}
                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Yes, Delete Everything</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full bg-brand-cream text-brand-brown/70 font-bold py-4 rounded-2xl hover:bg-[#eee6d8] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
