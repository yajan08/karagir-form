"use client";

import { useState, useCallback, useEffect } from "react";
import { User, Phone, Users, CheckCircle, Copy, Loader2, MapPin, Share2, Sparkles, AlertCircle } from "lucide-react";
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

  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 2 * 1000;
    const colors = ["#d96f27", "#8b2323", "#c39b4b", "#fbf8f1"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Enhanced phone validation
    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      setIsSubmitting(false);
      return;
    }

    const guestNum = parseInt(formData.guestsCount);
    if (isNaN(guestNum) || guestNum < 1 || guestNum > 50) {
      setError("Attendees count must be between 1 and 50.");
      setIsSubmitting(false);
      return;
    }

    try {
      let isUnique = false;
      let registrationId = "";

      // Improved unique ID generation logic
      while (!isUnique) {
        const timestamp = Date.now().toString().slice(-3);
        const random = Math.floor(1000 + Math.random() * 9000).toString();
        registrationId = `EK-${random}${timestamp}`;

        const { data, error: fetchError } = await supabase
          .from("registrations")
          .select("registration_id")
          .eq("registration_id", registrationId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (!data) isUnique = true;
      }

      const { error: dbError } = await supabase
        .from("registrations")
        .insert([
          {
            registration_id: registrationId,
            full_name: formData.fullName.trim(),
            phone_number: formData.phoneNumber.trim(),
            village: formData.village.trim(),
            guests_count: guestNum,
          },
        ]);

      if (dbError) throw dbError;

      setSuccessId(registrationId);
      triggerConfetti();
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Enhanced Copy to Clipboard with Fallbacks
   * Works on mobile browsers, non-secure contexts, and older browsers.
   */
  const copyToClipboard = async () => {
    if (!successId) return;

    // 1. Try the modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(successId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        console.error("Clipboard API failed, trying fallback", err);
      }
    }

    // 2. Fallback: The "Hidden Input" method
    try {
      const textArea = document.createElement("textarea");
      textArea.value = successId;
      textArea.style.position = "fixed";
      textArea.style.left = "-99999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Fallback failed", err);
    }
  };

  const handleShare = async () => {
    if (!successId) return;
    const shareData = {
      title: "Karagir Mahakumbh 2026 Registration",
      text: `My Registration ID for Karagir Mahakumbh 2026 is: ${successId}. Excited to be part of the heritage event!`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center min-h-screen py-10 px-4 sm:px-8 relative z-10 overflow-x-hidden">
      <div className="w-full max-w-md relative z-20">
        {successId ? (
          // SIMPLIFIED PRODUCTION-READY SUCCESS SCREEN (BOTTOM OVERLAY)
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
                      <div class="p-6 bg-white rounded-2xl border-2 border-[#e5dcd1]">
                        <p class="text-[10px] font-bold text-[#5c2a18]/60 uppercase mb-1">Registration ID</p>
                        <div class="text-3xl font-black text-[#8b2323] font-mono">${successId}</div>
                      </div>
                      <button onclick="window.location.reload()" class="mt-8 text-sm font-bold text-[#d96f27]">Reload Page</button>
                    </div>
                  `;
                }}
              />

              {/* Bottom 1/3 Overlay - Refined and Focused */}
              <div className="relative z-20 w-full bg-gradient-to-t from-black via-black/95 to-transparent p-6 sm:p-10 pt-28 pb-14 flex flex-col items-center text-center">
                
                {/* Swapped Layout: Pass ID on Top, Success Message & Name Below */}
                <div className="flex flex-col items-center gap-6 mb-10 animate-slide-up">
                  
                  {/* Registration ID - Now at the Top */}
                  <div className="flex flex-col items-center">
                    <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-3">
                      Pass ID
                    </span>
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tighter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] animate-pulse-slow">
                        {successId}
                      </h2>
                      <button
                        onClick={copyToClipboard}
                        className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/20 shadow-2xl backdrop-blur-md"
                        title="Copy ID"
                      >
                        {copied ? (
                          <CheckCircle className="w-6 h-6 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Success Message & User Info - Now Below the ID */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-[#d96f27] px-4 py-1.5 rounded-lg shadow-xl mb-1">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        Registration Successful
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-white/50 text-[11px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-white/80">{formData.fullName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>{formData.guestsCount} {parseInt(formData.guestsCount) > 1 ? 'Guests' : 'Guest'}</span>
                    </div>
                  </div>

                </div>

                <div className="flex flex-col w-full gap-4 max-w-[200px] animate-fade-in delay-500">
                  <button
                    onClick={() => setSuccessId(null)}
                    className="py-3 text-white/20 text-[9px] font-bold hover:text-white/50 transition-all uppercase tracking-[0.4em] border-t border-white/5 mt-4"
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

            {/* DECORATIVE ELEMENTS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] flex items-center justify-center -rotate-12 scale-150">
               <img src="/logos/logo4.jpg" className="w-[80%] h-auto grayscale" alt="" />
            </div>
            
            <div className="text-center mb-10 relative z-10 transition-transform duration-500 group-focus-within:-translate-y-2">
              <div className="inline-flex flex-col items-center">
                 <div className="w-16 h-1 bg-[#8b2323]/20 rounded-full mb-6" />
                 <h2 className="text-4xl font-black text-[#5c2a18] mb-3 tracking-tight">
                   कारागीर महाकुंभ
                 </h2>
                 <div className="flex items-center justify-center gap-3 text-[#d96f27] font-bold text-[10px] uppercase tracking-[0.3em]">
                   <span className="w-8 h-[1px] bg-[#d96f27]/30" />
                   New Entry
                   <span className="w-8 h-[1px] bg-[#d96f27]/30" />
                 </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-fade-in">
              {error && (
                <div className="p-4 bg-red-50 text-[#8b2323] rounded-2xl text-[11px] font-bold border-2 border-red-100 shadow-xl flex items-center gap-3 animate-shake">
                   <AlertCircle className="w-4 h-4 flex-shrink-0" />
                   {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b2323]/60 ml-2 uppercase tracking-[0.2em] block">
                    Your Full Name
                  </label>
                  <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#c39b4b] transition-colors focus-within:text-[#8b2323]">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="block w-full pl-14 pr-5 py-5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-[12px] focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                      placeholder="E.g. Rajesh Kumar"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b2323]/60 ml-2 uppercase tracking-[0.2em] block">
                    Contact Number
                  </label>
                  <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#c39b4b]">
                      <Phone className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="block w-full pl-14 pr-5 py-5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-[12px] focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                      placeholder="Enter 10 Digit Mobile No."
                    />
                  </div>
                </div>

                {/* Village */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b2323]/60 ml-2 uppercase tracking-[0.2em] block">
                    Village Name
                  </label>
                  <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#c39b4b]">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      className="block w-full pl-14 pr-5 py-5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm placeholder:text-[#3b2313]/20 focus:bg-white focus:ring-[12px] focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                      placeholder="Enter your village"
                    />
                  </div>
                </div>

                {/* Attendees */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8b2323]/60 ml-2 uppercase tracking-[0.2em] block">
                    Total Attendees
                  </label>
                  <div className="relative transition-all duration-300 focus-within:scale-[1.02]">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#c39b4b]">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={formData.guestsCount}
                      onChange={(e) => setFormData({ ...formData, guestsCount: e.target.value })}
                      className="block w-full pl-14 pr-5 py-5 bg-white/40 border-2 border-[#e5dcd1] rounded-2xl text-[#3b2313] font-bold text-sm focus:bg-white focus:ring-[12px] focus:ring-[#8b2323]/5 focus:border-[#8b2323] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group/btn flex items-center justify-center gap-3 bg-gradient-to-br from-[#8b2323] to-[#5c2a18] text-white font-black py-6 rounded-2xl hover:brightness-110 focus:ring-4 focus:ring-[#8b2323]/30 transition-all active:scale-[0.98] disabled:opacity-80 disabled:pointer-events-none shadow-2xl shadow-[#8b2323]/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="tracking-widest uppercase text-xs">Processing...</span>
                    </>
                  ) : (
                    <span className="tracking-[0.25em] uppercase text-xs flex items-center gap-2">
                      Generate Entry Pass
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 border-t border-dashed border-[#8b2323]/10 pt-6 text-center">
              <p className="text-[#5c2a18]/40 text-[9px] font-bold uppercase tracking-[0.5em]">
                EST. 2026 HERITAGE
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 pb-10" />
    </main>
  );
}
