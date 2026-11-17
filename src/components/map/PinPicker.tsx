'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface PinPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const DynamicPinPicker = dynamic(() => import('./PinPickerInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      <span className="text-[11px] font-mono">Loading Interactive Pin Picker...</span>
    </div>
  ),
});

export default function PinPicker(props: PinPickerProps) {
  return <DynamicPinPicker {...props} />;
}
