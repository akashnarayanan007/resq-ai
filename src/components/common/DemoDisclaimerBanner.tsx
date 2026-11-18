'use client';

import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';
import { CHENNAI_EMERGENCY_CONTACTS } from '@/data/simulatedData';

export default function DemoDisclaimerBanner() {
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  return (
    <>
      <div className="bg-[#080F23]/95 border-b border-amber-500/30 text-amber-200 text-xs px-4 py-2 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              SIMULATION MODE
            </span>
            <span className="text-slate-300 font-medium">
              Synthetic Chennai disaster data for technology demonstration. <strong className="text-white font-semibold">NOT connected to 112 or live emergency services.</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelplineModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Helplines (TN)</span>
            </button>
          </div>
        </div>
      </div>

      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#101C35] border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl shadow-black/80 relative">
            <button
              onClick={() => setShowHelplineModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#172541] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Official Emergency Helplines</h3>
                <p className="text-xs text-slate-400">If you are facing an active emergency in Tamil Nadu, dial official emergency numbers:</p>
              </div>
            </div>

            <div className="space-y-2.5 my-4 max-h-[60vh] overflow-y-auto pr-1">
              {CHENNAI_EMERGENCY_CONTACTS.map((contact) => (
                <div
                  key={contact.name}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#080F23] border border-[#1E2E4E] hover:border-slate-600 transition"
                >
                  <div>
                    <div className="font-semibold text-sm text-white">{contact.name}</div>
                    <div className="text-xs text-slate-400">{contact.desc}</div>
                  </div>
                  <a
                    href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-mono font-bold text-sm tracking-wide transition active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E2E4E] flex items-center justify-between text-xs text-slate-400">
              <span>RESQ.AI is an AI hackathon technology prototype.</span>
              <button
                onClick={() => setShowHelplineModal(false)}
                className="px-4 py-2 bg-[#172541] hover:bg-[#1E3156] text-white rounded-xl font-medium transition"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
