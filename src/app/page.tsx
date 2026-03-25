"use client";

import { useState } from "react";
import { User, Phone, Users, CheckCircle, Copy, Loader2, MapPin } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    village: "",
    guestsCount: "1",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerConfetti = () => {
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#d96f27", "#8b2323", "#c39b4b", "#fbf8f1"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number.");
      setIsSubmitting(false);
      return;
    }

    const guestNum = parseInt(formData.guestsCount);
    if (isNaN(guestNum) || guestNum < 1 || guestNum > 20) {
      setError("Guests count must be between 1 and 20.");
      setIsSubmitting(false);
      return;
    }

    try {
      let isUnique = false;
      let registrationId = "";

      while (!isUnique) {
        const digits = Math.floor(100000 + Math.random() * 900000).toString();
        registrationId = `EK-${digits}`;

        const { data, error: fetchError } = await supabase
          .from("registrations")
          .select("registration_id")
          .eq("registration_id", registrationId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!data) {
          isUnique = true;
        }
      }

      const { error: dbError } = await supabase
        .from("registrations")
        .insert([
          {
            registration_id: registrationId,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            village: formData.village,
            guests_count: guestNum,
          },
        ]);

      if (dbError) throw dbError;

      setSuccessId(registrationId);
      triggerConfetti();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (successId) {
      navigator.clipboard.writeText(successId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center min-h-screen py-10 px-4 sm:px-8 relative z-10">

      <div className="w-full max-w-md relative z-20">

        {successId ? (
          // SUCCESS SCREEN REDESIGN
          <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-500 flex flex-col items-center justify-center overflow-hidden">
            <div className="relative w-full h-full max-w-lg mx-auto flex flex-col justify-end">
              <img
                src="/karagir.jpeg"
                alt="Event Poster"
                className="absolute inset-0 w-full h-full object-cover sm:object-contain object-center scale-[1.01]"
                onError={(e) => {
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="h-full w-full flex flex-col items-center justify-center p-12 text-center bg-[#fbf8f1]">
                      <div class="text-4xl font-black text-[#8b2323] mb-4">POSTER NOT FOUND</div>
                      <p class="text-[#5c2a18]/60 text-sm font-medium">Please ensure 'public/karagir.jpeg' exists.</p>
                      <div class="mt-8 p-6 bg-white rounded-2xl border-2 border-[#e5dcd1]">
                        <p class="text-[10px] font-bold text-[#5c2a18]/60 uppercase mb-1">Registration ID</p>
                        <div class="text-3xl font-black text-[#8b2323] font-mono">${successId}</div>
                      </div>
                      <button onclick="window.location.reload()" class="mt-8 text-sm font-bold text-[#d96f27]">Reload Page</button>
                    </div>
                  `;
                }}
              />

              {/* Overlay details at the bottom 1/4th - Redesigned per strict instructions */}
              <div className="relative z-10 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 sm:p-8 pt-20 pb-10 flex flex-col items-center text-center">
                
                {/* Registration ID Prominently at Top */}
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    {successId}
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95 border border-white/20 shadow-xl"
                    title="Copy ID"
                  >
                    {copied ? (
                      <CheckCircle className="w-6 h-6 text-[#4ade80]" />
                    ) : (
                      <Copy className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>

                {/* Full Name and Guests Below in Smaller Muted Font */}
                <div className="space-y-1 mb-10">
                  <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
                    {formData.fullName}
                  </p>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">
                    Guests: {formData.guestsCount}
                  </p>
                </div>

                <div className="flex flex-col w-full gap-2 max-w-[220px]">
                  <button
                    onClick={() => setSuccessId(null)}
                    className="py-3 text-white/30 text-[10px] font-bold hover:text-white/60 transition-all uppercase tracking-[0.3em] border-t border-white/10 mt-4"
                  >
                    Register another
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // REGISTRATION FORM
          <div className="bg-[radial-gradient(circle_at_top,_#fff7ec,_#f4e1cf_40%,_#e9d0b7)] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(59,35,19,0.35)] p-6 sm:p-10 border-4 border-double border-[#8b2323]/20 relative overflow-hidden backdrop-blur-xl group">

            {/* HERITAGE DESIGN ELEMENTS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] flex items-center justify-center -rotate-12 scale-150">
              <img src="/logos/logo4.jpg" className="w-[80%] h-auto grayscale" alt="" />
            </div>
            <div className="absolute -top-12 -right-12 w-48 h-48 opacity-[0.05] pointer-events-none rotate-12">
              <img src="/logos/logo2.jpg" className="w-full h-full object-contain grayscale" alt="" />
            </div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 opacity-[0.05] pointer-events-none -rotate-12">
              <img src="/logos/logo3.jpg" className="w-full h-full object-contain grayscale" alt="" />
            </div>

            <div className="absolute top-0 right-0 w-80 h-80 bg-[#d96f27] rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.08] pointer-events-none" />

            <div className="text-center mb-10 relative z-10">
              <div className="w-20 h-2 bg-gradient-to-r from-transparent via-[#8b2323]/40 to-transparent mx-auto mb-6"></div>
              <h2 className="text-4xl font-black text-[#5c2a18] mb-3 tracking-tight">
                कारागीर महाकुंभ
              </h2>
              <div className="flex items-center justify-center gap-3 text-[#d96f27] font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
                <span className="w-10 h-[1px] bg-[#d96f27]/30"></span>
                Registration
                <span className="w-10 h-[1px] bg-[#d96f27]/30"></span>
              </div>
              <p className="text-[#5c2a18]/70 text-sm font-medium italic">
                Secure your entry for the grand event
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 px-1">
              {error && (
                <div className="p-4 bg-red-50 text-[#8b2323] rounded-2xl text-[11px] font-bold border-2 border-red-100 shadow-inner flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8b2323] animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[#8b2323] ml-2 uppercase tracking-[0.2em]">
                  Full Name
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#c39b4b] transition-colors group-focus-within/input:text-[#8b2323]">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="block w-full pl-13 pr-5 py-4.5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-8 focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                    placeholder="E.g. Rajesh Kumar"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[#8b2323] ml-2 uppercase tracking-[0.2em]">
                  Phone Number
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#c39b4b] transition-colors group-focus-within/input:text-[#8b2323]">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="block w-full pl-13 pr-5 py-4.5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-8 focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>

              {/* Village Input Field */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[#8b2323] ml-2 uppercase tracking-[0.2em]">
                  Village
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#c39b4b] transition-colors group-focus-within/input:text-[#8b2323]">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) =>
                      setFormData({ ...formData, village: e.target.value })
                    }
                    className="block w-full pl-13 pr-5 py-4.5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-8 focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                    placeholder="Enter your village"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-[#8b2323] ml-2 uppercase tracking-[0.2em]">
                  Total Attendees
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#c39b4b] transition-colors group-focus-within/input:text-[#8b2323]">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.guestsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guestsCount: e.target.value,
                      })
                    }
                    className="block w-full pl-13 pr-5 py-4.5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm focus:bg-white focus:ring-8 focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative flex items-center justify-center gap-3 bg-gradient-to-br from-[#8b2323] to-[#5c2a18] text-white font-black py-5 rounded-2xl hover:brightness-110 focus:ring-4 focus:ring-[#8b2323]/30 transition-all active:scale-[0.98] disabled:opacity-80 disabled:pointer-events-none shadow-2xl shadow-[#8b2323]/40 overflow-hidden"
                >
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                      <span className="relative z-10 tracking-widest uppercase text-xs">Registering...</span>
                    </>
                  ) : (
                    <span className="relative z-10 tracking-[0.2em] uppercase text-xs">Generate Entry Pass</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 border-t border-dashed border-[#8b2323]/10 pt-4 text-center">
              <p className="text-[#5c2a18]/40 text-[9px] font-bold uppercase tracking-[0.3em]">
                Heritage Inspired Registration
              </p>
            </div>
          </div>
        )}

      </div>

      <div className="mt-10 pb-10" />
    </main>
  );
}
