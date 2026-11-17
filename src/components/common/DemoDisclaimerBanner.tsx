'use client';

import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X, ExternalLink } from 'lucide-react';
import { CHENNAI_EMERGENCY_CONTACTS } from '@/data/simulatedData';

export default function DemoDisclaimerBanner() {
  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const [minimized, setMinimized] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-b border-amber-600/40 text-amber-200 text-xs px-4 py-2 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              DEMO SIMULATION MODE
            </span>
            <span className="text-amber-100/90 font-medium">
              Simulation environment with synthetic Chennai flood data. <strong className="text-white">NOT connected to 112 or official government emergency dispatchers.</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelplineModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition"
            >
              <PhoneCall className="w-3 h-3 text-amber-300" />
              Official Helplines (Chennai/TN)
            </button>
          </div>
        </div>
      </div>

      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B1120] border border-amber-500/50 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelplineModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Official Emergency Helplines</h3>
                <p className="text-xs text-slate-400">If you are facing a real life-threatening emergency in Chennai / Tamil Nadu:</p>
              </div>
            </div>

            <div className="space-y-2.5 my-4 max-h-[60vh] overflow-y-auto pr-1">
              {CHENNAI_EMERGENCY_CONTACTS.map((contact) => (
                <div
                  key={contact.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-100">{contact.name}</div>
                    <div className="text-xs text-slate-400">{contact.desc}</div>
                  </div>
                  <a
                    href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 font-mono font-bold text-sm tracking-wide"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>RESQ.AI is a hackathon technology demonstrator.</span>
              <button
                onClick={() => setShowHelplineModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
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
