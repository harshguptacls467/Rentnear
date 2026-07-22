type PlaygroundExample = {
  id: string;
  name: string;
  prompt: string;
  data: Record<string, unknown>[];
};

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: "workforce-ops",
    name: "Workforce Operations",
    prompt:
      "Plot a suitable chart for workforce utilization and performance trends.",
    data: [
      {
        date: "2026-01-01",
        department: "Engineering",
        employee_count: 42,
        allocated_hours: 310,
        clocked_hours: 295,
        benched_hours: 15,
        revenue: 12000,
        project: "AI Analytics",
        region: "India",
        satisfaction_score: 4.3,
      },
      {
        date: "2026-01-02",
        department: "Engineering",
        employee_count: 42,
        allocated_hours: 320,
        clocked_hours: 300,
        benched_hours: 20,
        revenue: 13000,
        project: "AI Analytics",
        region: "India",
        satisfaction_score: 4.1,
      },
      {
        date: "2026-01-03",
        department: "Design",
        employee_count: 15,
        allocated_hours: 110,
        clocked_hours: 100,
        benched_hours: 10,
        revenue: 4500,
        project: "UI Revamp",
        region: "Europe",
        satisfaction_score: 4.5,
      },
      {
        date: "2026-01-04",
        department: "Marketing",
        employee_count: 20,
        allocated_hours: 150,
        clocked_hours: 140,
        benched_hours: 10,
        revenue: 6000,
        project: "Growth Campaign",
        region: "USA",
        satisfaction_score: 3.9,
      },
      {
        date: "2026-01-05",
        department: "Engineering",
        employee_count: 42,
        allocated_hours: 330,
        clocked_hours: 315,
        benched_hours: 15,
        revenue: 14000,
        project: "Platform Upgrade",
        region: "India",
        satisfaction_score: 4.4,
      },
      {
        date: "2026-01-06",
        department: "Design",
        employee_count: 15,
        allocated_hours: 120,
        clocked_hours: 108,
        benched_hours: 12,
        revenue: 4800,
        project: "UX Research",
        region: "Europe",
        satisfaction_score: 4.6,
      },
    ],
  },
  {
    id: "quarterly-sales",
    name: "Quarterly Sales",
    prompt:
      "Show a suitable chart for revenue and profit trend across quarters by region.",
    data: [
      {
        quarter: "Q1",
        region: "APAC",
        revenue: 120000,
        profit: 26000,
        orders: 840,
      },
      {
        quarter: "Q2",
        region: "APAC",
        revenue: 135000,
        profit: 30000,
        orders: 910,
      },
      {
        quarter: "Q3",
        region: "APAC",
        revenue: 142000,
        profit: 32500,
        orders: 960,
      },
      {
        quarter: "Q4",
        region: "APAC",
        revenue: 158000,
        profit: 37000,
        orders: 1025,
      },
      {
        quarter: "Q1",
        region: "EMEA",
        revenue: 98000,
        profit: 21000,
        orders: 700,
      },
      {
        quarter: "Q2",
        region: "EMEA",
        revenue: 104000,
        profit: 22500,
        orders: 735,
      },
      {
        quarter: "Q3",
        region: "EMEA",
        revenue: 112500,
        profit: 24800,
        orders: 780,
      },
      {
        quarter: "Q4",
        region: "EMEA",
        revenue: 121000,
        profit: 27200,
        orders: 830,
      },
    ],
  },
  {
    id: "traffic-sources",
    name: "Website Traffic Sources",
    prompt:
      "Plot a suitable chart to show traffic source share and conversion strength.",
    data: [
      {
        source: "Organic",
        sessions: 18500,
        conversions: 1280,
        conversion_rate: 6.92,
      },
      {
        source: "Paid Ads",
        sessions: 12400,
        conversions: 620,
        conversion_rate: 5.0,
      },
      {
        source: "Email",
        sessions: 8100,
        conversions: 705,
        conversion_rate: 8.7,
      },
      {
        source: "Referral",
        sessions: 5300,
        conversions: 290,
        conversion_rate: 5.47,
      },
      {
        source: "Social",
        sessions: 7600,
        conversions: 350,
        conversion_rate: 4.61,
      },
    ],
  },
  {
    id: "supply-chain",
    name: "Supply Chain Delivery",
    prompt: "Visualize delivery lead time and delay count by warehouse.",
    data: [
      {
        warehouse: "Mumbai",
        week: "W1",
        lead_time_days: 3.4,
        delayed_shipments: 12,
      },
      {
        warehouse: "Mumbai",
        week: "W2",
        lead_time_days: 3.1,
        delayed_shipments: 10,
      },
      {
        warehouse: "Berlin",
        week: "W1",
        lead_time_days: 4.2,
        delayed_shipments: 16,
      },
      {
        warehouse: "Berlin",
        week: "W2",
        lead_time_days: 3.8,
        delayed_shipments: 13,
      },
      {
        warehouse: "Dallas",
        week: "W1",
        lead_time_days: 2.9,
        delayed_shipments: 8,
      },
      {
        warehouse: "Dallas",
        week: "W2",
        lead_time_days: 2.7,
        delayed_shipments: 6,
      },
    ],
  },
  {
    id: "energy-consumption",
    name: "Energy Consumption",
    prompt:
      "Create a suitable chart for daily energy usage by building and compare peak demand.",
    data: [
      { day: "Mon", building: "HQ", kwh: 1480, peak_kw: 320 },
      { day: "Tue", building: "HQ", kwh: 1525, peak_kw: 338 },
      { day: "Wed", building: "HQ", kwh: 1410, peak_kw: 305 },
      { day: "Mon", building: "Plant-A", kwh: 2350, peak_kw: 520 },
      { day: "Tue", building: "Plant-A", kwh: 2415, peak_kw: 548 },
      { day: "Wed", building: "Plant-A", kwh: 2290, peak_kw: 502 },
    ],
  },
];

export type { PlaygroundExample };
