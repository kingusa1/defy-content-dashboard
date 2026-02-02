import { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import axios from 'axios';

export interface DashboardData {
  premiums: number;
  activePolicies: number;
  claimsRatio: number;
  newLeads: number;
  monthlyPerformance: { month: string; value: number }[];
  policyDistribution: { name: string; value: number }[];
  recentTransactions: { id: string; client: string; type: string; amount: number; status: string }[];
}

// Default demo data - will be used when no Google Sheet URL is provided
const DEFAULT_DATA: DashboardData = {
  premiums: 847500,
  activePolicies: 2847,
  claimsRatio: 23,
  newLeads: 156,
  monthlyPerformance: [
    { month: 'Jan', value: 125000 },
    { month: 'Feb', value: 142000 },
    { month: 'Mar', value: 138000 },
    { month: 'Apr', value: 165000 },
    { month: 'May', value: 152000 },
    { month: 'Jun', value: 178000 },
    { month: 'Jul', value: 195000 },
    { month: 'Aug', value: 188000 },
    { month: 'Sep', value: 210000 },
    { month: 'Oct', value: 225000 },
    { month: 'Nov', value: 245000 },
    { month: 'Dec', value: 268000 },
  ],
  policyDistribution: [
    { name: 'Auto', value: 1250 },
    { name: 'Home', value: 820 },
    { name: 'Life', value: 485 },
    { name: 'Health', value: 292 },
  ],
  recentTransactions: [
    { id: '1', client: 'Sarah Johnson', type: 'Auto Insurance', amount: 2400, status: 'Active' },
    { id: '2', client: 'Michael Chen', type: 'Home Insurance', amount: 3500, status: 'Active' },
    { id: '3', client: 'Emily Davis', type: 'Life Insurance', amount: 1800, status: 'Pending' },
    { id: '4', client: 'James Wilson', type: 'Auto Insurance', amount: 2100, status: 'Active' },
    { id: '5', client: 'Maria Garcia', type: 'Health Insurance', amount: 4200, status: 'Processing' },
    { id: '6', client: 'Robert Taylor', type: 'Home Insurance', amount: 2800, status: 'Active' },
  ],
};

interface GoogleSheetRow {
  [key: string]: string;
}

// Transform raw Google Sheets data to DashboardData format
const transformSheetData = (rows: GoogleSheetRow[]): DashboardData => {
  if (!rows || rows.length === 0) {
    return DEFAULT_DATA;
  }

  let premiums = 0;
  let activePolicies = 0;
  let claimsRatio = 0;
  let newLeads = 0;
  const monthlyPerformance: { month: string; value: number }[] = [];
  const policyDistribution: { name: string; value: number }[] = [];
  const recentTransactions: { id: string; client: string; type: string; amount: number; status: string }[] = [];

  rows.forEach((row, index) => {
    const keys = Object.keys(row);

    keys.forEach(key => {
      const lowerKey = key.toLowerCase();
      const value = row[key];

      if (lowerKey.includes('premium') && lowerKey.includes('total')) {
        premiums = parseFloat(value.replace(/[^0-9.-]/g, '')) || premiums;
      }
      if (lowerKey.includes('active') && lowerKey.includes('polic')) {
        activePolicies = parseInt(value.replace(/[^0-9]/g, '')) || activePolicies;
      }
      if (lowerKey.includes('claim') && lowerKey.includes('ratio')) {
        claimsRatio = parseFloat(value.replace(/[^0-9.-]/g, '')) || claimsRatio;
      }
      if (lowerKey.includes('lead') || lowerKey.includes('new')) {
        newLeads = parseInt(value.replace(/[^0-9]/g, '')) || newLeads;
      }
    });

    if (row['Month'] && row['Value']) {
      monthlyPerformance.push({
        month: row['Month'],
        value: parseFloat(row['Value'].replace(/[^0-9.-]/g, '')) || 0
      });
    }

    if (row['PolicyType'] && row['Count']) {
      policyDistribution.push({
        name: row['PolicyType'],
        value: parseInt(row['Count'].replace(/[^0-9]/g, '')) || 0
      });
    }

    if (row['Client'] || row['ClientName'] || row['Name']) {
      recentTransactions.push({
        id: (index + 1).toString(),
        client: row['Client'] || row['ClientName'] || row['Name'] || 'Unknown',
        type: row['Type'] || row['PolicyType'] || row['InsuranceType'] || 'General',
        amount: parseFloat((row['Amount'] || row['Premium'] || '0').replace(/[^0-9.-]/g, '')) || 0,
        status: row['Status'] || 'Active'
      });
    }
  });

  return {
    premiums: premiums || DEFAULT_DATA.premiums,
    activePolicies: activePolicies || DEFAULT_DATA.activePolicies,
    claimsRatio: claimsRatio || DEFAULT_DATA.claimsRatio,
    newLeads: newLeads || DEFAULT_DATA.newLeads,
    monthlyPerformance: monthlyPerformance.length > 0 ? monthlyPerformance : DEFAULT_DATA.monthlyPerformance,
    policyDistribution: policyDistribution.length > 0 ? policyDistribution : DEFAULT_DATA.policyDistribution,
    recentTransactions: recentTransactions.length > 0 ? recentTransactions.slice(0, 10) : DEFAULT_DATA.recentTransactions,
  };
};

export const useGoogleSheets = (sheetUrl: string) => {
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!sheetUrl) {
      if (mountedRef.current) {
        setData(DEFAULT_DATA);
        setLoading(false);
        setLastUpdated(new Date());
      }
      return;
    }

    try {
      if (mountedRef.current) setError(null);
      const response = await axios.get(sheetUrl, { timeout: 10000 });
      const csvData = response.data;

      Papa.parse<GoogleSheetRow>(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (mountedRef.current) {
            const transformedData = transformSheetData(results.data);
            setData(transformedData);
            setLastUpdated(new Date());
            setLoading(false);
          }
        },
        error: () => {
          if (mountedRef.current) {
            setError('Failed to parse spreadsheet data');
            setData(DEFAULT_DATA);
            setLoading(false);
          }
        }
      });
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData(DEFAULT_DATA);
        setLoading(false);
      }
    }
  }, [sheetUrl]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch - wrapped in setTimeout to avoid synchronous setState
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 0);

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchData, 30000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refresh };
};
