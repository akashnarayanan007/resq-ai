import { NextRequest, NextResponse } from 'next/server';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';
import { AnalyticsData, IncidentCategory, IncidentSeverity } from '@/types';
import { getCategoryLabel } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const [incidents, teams] = await Promise.all([
      incidentRepository.getAll(),
      teamRepository.getAll(),
    ]);

    // Bounded calculation: max 100 incidents analyzed
    const boundedList = incidents.slice(0, 100);

    const totalIncidents = boundedList.length;
    let pendingCount = 0;
    let underReviewCount = 0;
    let assignedCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let invalidCount = 0;

    const urgencyDist = { critical: 0, high: 0, medium: 0, low: 0 };
    const categoryCounts: Record<IncidentCategory, number> = {
      flood_water: 0,
      medical_critical: 0,
      elderly_infant_stranded: 0,
      structural_collapse: 0,
      power_hazard: 0,
      food_water_supply: 0,
      road_blockage: 0,
    };

    let totalCitizensAssisted = 0;

    boundedList.forEach((inc) => {
      // Status counts
      if (inc.status === 'pending') pendingCount++;
      else if (inc.status === 'under_review') underReviewCount++;
      else if (inc.status === 'assigned') assignedCount++;
      else if (inc.status === 'in_progress') inProgressCount++;
      else if (inc.status === 'resolved') resolvedCount++;
      else if (inc.status === 'invalid') invalidCount++;

      // Urgency distribution
      const urgency = (inc.preliminaryUrgency || inc.severity || 'high') as IncidentSeverity;
      if (urgency in urgencyDist) {
        urgencyDist[urgency]++;
      }

      // Category breakdown
      if (inc.category in categoryCounts) {
        categoryCounts[inc.category]++;
      }

      // Citizens assisted (count citizens in assigned/in_progress/resolved)
      if (inc.status === 'resolved' || inc.status === 'in_progress' || inc.status === 'assigned') {
        totalCitizensAssisted += inc.reporter?.citizenCount || 1;
      }
    });

    const activeCount = totalIncidents - resolvedCount - invalidCount;

    // Category breakdown array with labels
    const categoryBreakdown = Object.keys(categoryCounts).map((catKey) => ({
      category: catKey as IncidentCategory,
      label: getCategoryLabel(catKey as IncidentCategory),
      count: categoryCounts[catKey as IncidentCategory],
    }));

    // Hourly trends from stored demo data timestamps
    const hourMap: Record<string, { reported: number; resolved: number }> = {};
    // Seed standard chronological buckets
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    hours.forEach((h) => {
      hourMap[h] = { reported: 0, resolved: 0 };
    });

    boundedList.forEach((inc) => {
      const d = new Date(inc.reportedAt);
      const hNum = d.getHours();
      // Bucket to nearest even hour
      const bucketHour = `${String(Math.floor(hNum / 2) * 2).padStart(2, '0')}:00`;
      if (!hourMap[bucketHour]) {
        hourMap[bucketHour] = { reported: 0, resolved: 0 };
      }
      hourMap[bucketHour].reported++;
      if (inc.status === 'resolved') {
        hourMap[bucketHour].resolved++;
      }
    });

    const hourlyTrends = Object.keys(hourMap)
      .sort()
      .map((hour) => ({
        hour,
        reportedCount: hourMap[hour].reported,
        resolvedCount: hourMap[hour].resolved,
      }));

    const deployedTeamsCount = teams.filter(
      (t) => t.status === 'en_route' || t.status === 'on_scene'
    ).length;

    const analyticsPayload: AnalyticsData = {
      totalIncidents,
      activeCount,
      pendingCount,
      underReviewCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      invalidCount,
      urgencyDistribution: urgencyDist,
      categoryBreakdown,
      hourlyTrends,
      deployedTeamsCount,
      totalTeamsCount: teams.length,
      totalCitizensAssisted: totalCitizensAssisted + 42, // Includes baseline evacuated tally
      simulatedDisclaimer:
        'SIMULATED DRILL ANALYTICS: All figures reflect synthetic demonstration incidents for the Chennai flood scenario. Never connected to real emergency 112 dispatch.',
    };

    return NextResponse.json(analyticsPayload);
  } catch (err: any) {
    console.error('Analytics API error:', err);
    return NextResponse.json(
      { error: 'Failed to aggregate analytics data.' },
      { status: 500 }
    );
  }
}
