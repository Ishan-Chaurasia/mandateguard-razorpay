import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsOverview from './components/MetricsOverview';
import BenchmarkCard from './components/BenchmarkCard';
import MandatesTable from './components/MandatesTable';
import MandateAuditDrawer from './components/MandateAuditDrawer';
import ExceptionsQueue from './components/ExceptionsQueue';
import AiPlayground from './components/AiPlayground';
import PolicyMatrixView from './components/PolicyMatrixView';
import LiveBatchStream from './components/LiveBatchStream';
import { Play, Sparkles, ShieldCheck, Layers, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandateId, setSelectedMandateId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBatchStreamOpen, setIsBatchStreamOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, mandatesRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/mandates')
      ]);

      const statsData = await statsRes.json();
      const mandatesData = await mandatesRes.json();

      setStats(statsData);
      setMandates(mandatesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSelectMandate = (mandateId) => {
    setSelectedMandateId(mandateId);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMandateId(null);
  };

  const handleRunBatch = () => {
    setIsBatchStreamOpen(true);
  };

  const handleBatchComplete = () => {
    fetchDashboardData();
  };

  const handleResetSeed = async () => {
    try {
      const res = await fetch('/api/batch/reset', { method: 'POST' });
      const data = await res.json();
      console.log('Reset response:', data);
      await fetchDashboardData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunBatch={handleRunBatch}
        onResetSeed={handleResetSeed}
        isRunning={isProcessing}
        pendingCount={stats?.pendingCharges || 0}
        exceptionsCount={stats?.exceptionsCount || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Metrics Strip */}
        <MetricsOverview stats={stats} />

        {/* Tab 1: Overview & Benchmark */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Benchmark vs Naive Retry */}
            <BenchmarkCard stats={stats} />

            {/* Mandates & Charges Preview Table */}
            <MandatesTable
              mandates={mandates}
              onSelectMandate={handleSelectMandate}
            />
          </div>
        )}

        {/* Tab 2: Mandates & Audit Explorer */}
        {activeTab === 'mandates' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <MandatesTable
              mandates={mandates}
              onSelectMandate={handleSelectMandate}
            />
          </div>
        )}

        {/* Tab 3: Exceptions & Manual Review Queue */}
        {activeTab === 'exceptions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ExceptionsQueue onRefreshStats={fetchDashboardData} />
          </div>
        )}

        {/* Tab 4: AI Sandbox / Playground */}
        {activeTab === 'playground' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AiPlayground />
          </div>
        )}

        {/* Tab 5: NPCI Policy Matrix */}
        {activeTab === 'policy' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PolicyMatrixView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060B14] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-400">MandateGuard</span> &bull; Razorpay AI Buildathon 2026 Submission
          </div>
          <div>
            Fintech-Native Bounded AI Agent for NPCI UPI Autopay / e-Mandates
          </div>
        </div>
      </footer>

      {/* End-to-End Audit Drawer */}
      <MandateAuditDrawer
        mandateId={selectedMandateId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />

      {/* Live SSE Batch Stream Modal */}
      <LiveBatchStream
        isOpen={isBatchStreamOpen}
        onClose={() => setIsBatchStreamOpen(false)}
        onComplete={handleBatchComplete}
      />
    </div>
  );
}
