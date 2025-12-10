import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Building, DollarSign, Search, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState({ totalStudents: 0, totalRevenue: 0, occupancy: 0 });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. FETCH ALL DATA
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // A. Get Students
      const { data: studentData, error: sError } = await supabase
        .from('students')
        .select('*, rooms(room_number, block_id)')
        .order('registration_number');
      
      if (sError) throw sError;
      setStudents(studentData);

      // B. Get Financials
      const { data: payments, error: pError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'Success');
      
      if (pError) throw pError;

      // C. Get Rooms for Occupancy Calc
      const { count: totalRooms } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
      const { count: occupiedRooms } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).gt('current_occupancy', 0);

      // D. Aggregate Stats
      const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      setStats({
        totalStudents: studentData.length,
        totalRevenue: revenue,
        occupancy: occupancyRate
      });

    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. ACTION: DELETE STUDENT (Eviction)
  const handleEvict = async (id) => {
    if (!window.confirm("WARNING: This will permanently remove the student and their room allocation. Proceed?")) return;

    try {
      // First clear room linkage to avoid FK errors (if handled manually)
      // Then delete student
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      
      alert("EVICTION SUCCESSFUL.");
      fetchDashboardData(); // Refresh list
    } catch (err) {
      alert("ERROR: Could not evict. Check payment records.");
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.registration_number.includes(searchTerm)
  );

  return (
    <div className="w-full h-full flex flex-col bg-black/90 text-red-500 font-mono animate-[slideIn_0.5s_ease-out] overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center border-b-2 border-red-600 p-4 bg-red-950/20 shrink-0">
        <div className="flex items-center gap-3">
            <AlertTriangle className="animate-pulse" />
            <h1 className="text-2xl font-bold tracking-widest">SYS_ADMIN :: ROOT ACCESS</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={fetchDashboardData} className="flex items-center gap-2 hover:text-white transition-colors">
                <RefreshCw size={18} /> REFRESH
            </button>
            <button onClick={onLogout} className="border border-red-600 px-4 py-1 hover:bg-red-600 hover:text-black transition-colors">
                [ LOGOUT ]
            </button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 shrink-0">
        <StatCard icon={<Users />} label="TOTAL REGISTERED" value={stats.totalStudents} />
        <StatCard icon={<DollarSign />} label="TOTAL REVENUE" value={`₹${stats.totalRevenue.toLocaleString()}`} />
        <StatCard icon={<Building />} label="OCCUPANCY RATE" value={`${stats.occupancy}%`} />
      </div>

      {/* --- DIRECTORY --- */}
      <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
        
        {/* Search Bar */}
        <div className="flex items-center border border-red-800 bg-black p-2 mb-4">
            <Search className="opacity-50 mr-2" />
            <input 
                type="text" 
                placeholder="SEARCH DATABASE BY NAME OR ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-red-100 w-full placeholder-red-900"
            />
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto border border-red-900/50 custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-red-900/20 sticky top-0 text-red-300">
                    <tr>
                        <th className="p-3 border-b border-red-800">REG ID</th>
                        <th className="p-3 border-b border-red-800">FULL NAME</th>
                        <th className="p-3 border-b border-red-800">BRANCH</th>
                        <th className="p-3 border-b border-red-800">ROOM ALLOCATED</th>
                        <th className="p-3 border-b border-red-800 text-center">ACTIONS</th>
                    </tr>
                </thead>
                <tbody className="text-red-100/80">
                    {loading ? (
                        <tr><td colSpan="5" className="p-10 text-center animate-pulse">&gt;&gt;FETCHING RECORDS...</td></tr>
                    ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <tr key={student.id} className="border-b border-red-900/30 hover:bg-red-900/10 transition-colors">
                                <td className="p-3 font-bold">{student.registration_number}</td>
                                <td className="p-3">{student.full_name}</td>
                                <td className="p-3">{student.branch}</td>
                                <td className="p-3">
                                    {student.rooms ? `ROOM ${student.rooms.room_number}` : <span className="opacity-30">NONE</span>}
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => handleEvict(student.id)}
                                        className="text-red-500 hover:text-white bg-red-950/50 hover:bg-red-600 p-2 rounded transition-all"
                                        title="EVICT STUDENT"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5" className="p-10 text-center opacity-50">NO MATCHING RECORDS FOUND</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Stats
function StatCard({ icon, label, value }) {
    return (
        <div className="bg-red-950/10 border border-red-800 p-4 flex items-center gap-4">
            <div className="p-3 bg-red-900/20 rounded-full text-red-500">
                {icon}
            </div>
            <div>
                <div className="text-xs text-red-400/60 tracking-widest">{label}</div>
                <div className="text-3xl font-vt323 text-red-100">{value}</div>
            </div>
        </div>
    )
}