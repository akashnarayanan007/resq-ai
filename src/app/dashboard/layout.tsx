'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { Incident } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const incidents = await incidentRepository.getAll();
        const crit = incidents.filter(
          (i) => i.severity === 'critical' && i.status !== 'resolved'
        ).length;
        setCriticalCount(crit);
      } catch (err) {
        console.error(err);
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#070C18]">
      <DashboardSidebar unreadCriticalCount={criticalCount} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
