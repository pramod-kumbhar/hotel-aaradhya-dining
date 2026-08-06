import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, UserPlus, Calendar, IndianRupee, CheckCircle, XCircle, Clock, Search, Plus, Trash2, Edit, Printer, ShieldCheck, Banknote, Lock, Unlock, BarChart2, CheckCircle2, Download, Eye, AlertCircle, FileSpreadsheet, MessageSquare, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const StaffManagementView = () => {
  const { lang, staffMembers, addStaffMember, updateStaffMember, deleteStaffMember, clearAllStaffMembers, attendanceRecords, markAttendance, submittedAttendanceDates, submitDailyAttendance, unlockDailyAttendance, salaryAdvances, salaryPayments, recordAdvance, paySalary, t } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance', 'directory', 'payroll'
  const [attendanceViewMode, setAttendanceViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Absent Dates Inspector Modal state
  const [inspectAbsentStaff, setInspectAbsentStaff] = useState(null);

  // Add Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Waiter',
    phone: '',
    monthlySalary: 12000,
    dailyRate: 400,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  // Advance Payment Modal State
  const [advanceModalStaff, setAdvanceModalStaff] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Salary Receipt Modal State
  const [salaryReceiptData, setSalaryReceiptData] = useState(null);

  // Calculate Monthly Payroll & Net Payable Salary for Employee
  const getEmployeePayroll = (staffId) => {
    const staff = staffMembers?.find((s) => s.id === staffId);
    if (!staff) return { presentDays: 0, halfDays: 0, absentDays: 0, totalDaysCount: 0, earnedSalary: 0, advanceTotal: 0, netPayable: 0, isPaid: false };

    const currentMonthPrefix = selectedDate.substring(0, 7); // 'YYYY-MM'
    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;

    Object.entries(attendanceRecords || {}).forEach(([key, value]) => {
      if (key.startsWith(currentMonthPrefix) && key.endsWith(`_${staffId}`)) {
        if (value === 'P') presentDays += 1;
        if (value === 'HD') halfDays += 0.5;
        if (value === 'A') absentDays += 1;
      }
    });

    const totalDaysCount = presentDays + halfDays;
    const earnedSalary = Math.round(totalDaysCount * (staff.dailyRate || (staff.monthlySalary / 30)));

    const staffAdvances = (salaryAdvances || []).filter(a => a.staffId === staffId && a.date.startsWith(currentMonthPrefix));
    const advanceTotal = staffAdvances.reduce((sum, a) => sum + a.amount, 0);

    const paymentKey = `${currentMonthPrefix}_${staffId}`;
    const paymentRecord = salaryPayments?.[paymentKey];
    const isPaid = !!paymentRecord;
    const netPayable = isPaid ? 0 : Math.max(0, earnedSalary - advanceTotal);

    return {
      presentDays,
      halfDays,
      absentDays,
      totalDaysCount,
      earnedSalary,
      advanceTotal,
      netPayable,
      isPaid,
      paidAmount: paymentRecord?.amount || (earnedSalary - advanceTotal),
      paidAt: paymentRecord?.paidAt
    };
  };

  // Check if selected date is submitted & locked
  const isDateSubmitted = !!submittedAttendanceDates?.[selectedDate];

  // Daily Attendance Statistics calculation
  const getDailyAttendanceStats = () => {
    if (!staffMembers || staffMembers.length === 0) {
      return { presentCount: 0, halfDayCount: 0, absentCount: 0, unmarkedCount: 0, attendanceRate: 0 };
    }
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    staffMembers.forEach((staff) => {
      const key = `${selectedDate}_${staff.id}`;
      const status = attendanceRecords?.[key];
      if (status === 'P') presentCount++;
      else if (status === 'HD') halfDayCount++;
      else if (status === 'A') absentCount++;
      else unmarkedCount++;
    });

    const markedTotal = presentCount + halfDayCount + absentCount;
    const totalEffective = presentCount + halfDayCount * 0.5;
    const attendanceRate = markedTotal > 0 ? Math.round((totalEffective / staffMembers.length) * 100) : 0;

    return { presentCount, halfDayCount, absentCount, unmarkedCount, attendanceRate };
  };

  const dailyStats = getDailyAttendanceStats();

  const markAllPresent = () => {
    (staffMembers || []).forEach((staff) => {
      markAttendance(selectedDate, staff.id, 'P');
    });
  };

  // Filtered Staff Members
  const filteredStaff = (staffMembers || []).filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  // Handle Save Staff
  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.phone) return;

    if (editingStaff) {
      updateStaffMember({ ...editingStaff, ...staffForm });
    } else {
      addStaffMember(staffForm);
    }

    setStaffForm({
      name: '',
      role: 'Waiter',
      phone: '',
      monthlySalary: 12000,
      dailyRate: 400,
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setEditingStaff(null);
    setIsAddStaffOpen(false);
  };

  // Handle Record Advance
  const handleRecordAdvanceSubmit = (e) => {
    e.preventDefault();
    if (!advanceModalStaff || !advanceAmount) return;

    recordAdvance(advanceModalStaff.id, Number(advanceAmount), advanceNotes);
    setAdvanceModalStaff(null);
    setAdvanceAmount('');
    setAdvanceNotes('');

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  // Get Detailed Absent & Half-Day Dates for Staff
  const getEmployeeAbsentDatesList = (staffId, monthPrefix = selectedDate.substring(0, 7)) => {
    const absentList = [];

    Object.entries(attendanceRecords || {}).forEach(([key, value]) => {
      if (key.startsWith(monthPrefix) && key.endsWith(`_${staffId}`)) {
        const dateStr = key.split('_')[0];
        if (value === 'A') {
          absentList.push({ date: dateStr, type: '🔴 गैरहजर (Full Absent)' });
        } else if (value === 'HD') {
          absentList.push({ date: dateStr, type: '🟡 अर्धा दिवस (Half Day)' });
        }
      }
    });

    return absentList.sort((a, b) => a.date.localeCompare(b.date));
  };

  // Calculate Weekly Attendance Stats for Employee
  const getEmployeeWeeklyAttendance = (staffId) => {
    const curDate = new Date(selectedDate);
    let pCount = 0;
    let hdCount = 0;
    let aCount = 0;
    const absentDates = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(curDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const key = `${dateStr}_${staffId}`;
      const status = attendanceRecords?.[key];
      if (status === 'P') pCount++;
      else if (status === 'HD') {
        hdCount++;
        absentDates.push({ date: dateStr, type: '🟡 अर्धा दिवस' });
      }
      else if (status === 'A') {
        aCount++;
        absentDates.push({ date: dateStr, type: '🔴 गैरहजर' });
      }
    }

    return { pCount, hdCount, aCount, totalPresent: pCount + hdCount * 0.5, absentDates };
  };

  // Download Attendance CSV Report
  const downloadAttendanceReportCsv = () => {
    const monthStr = selectedDate.substring(0, 7);
    const headers = ['Employee Name', 'Role', 'Phone', 'Month', 'Present Days', 'Half Days', 'Absent Days', 'Absent Dates List', 'Earned Salary (Rs)', 'Advance Taken (Rs)', 'Net Payable (Rs)'];
    
    const rows = (staffMembers || []).map(staff => {
      const payroll = getEmployeePayroll(staff.id);
      const absentList = getEmployeeAbsentDatesList(staff.id, monthStr)
        .map(item => `${item.date} (${item.type})`)
        .join('; ');

      return [
        `"${staff.name}"`,
        `"${staff.role}"`,
        `"${staff.phone}"`,
        `"${monthStr}"`,
        payroll.presentDays,
        payroll.halfDays,
        payroll.absentDays,
        `"${absentList || 'None'}"`,
        payroll.earnedSalary,
        payroll.advanceTotal,
        payroll.netPayable
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hotel_Aaradhya_Staff_Attendance_Report_${monthStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-4 pb-20 md:pb-8 animate-fade-in">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-900/90 p-3.5 rounded-2xl border border-amber-600/30 shadow-xl">
        <h2 className="text-base font-black text-amber-300 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          <span>कर्मचारी व हजेरी</span>
        </h2>

        {/* Sub Tab Navigation */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('attendance')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition ${
              activeSubTab === 'attendance'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>हजेरी</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('payroll')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition ${
              activeSubTab === 'payroll'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>पगार</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition ${
              activeSubTab === 'directory'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>कर्मचारी ({staffMembers?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* --- SUB TAB 1: ATTENDANCE REGISTER --- */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* 1. Live Attendance KPI Stats Banner */}
          {/* 1. Live Attendance KPI Stats Banner (Compact Horizontal Strip) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div className="bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-sm">
              <span className="text-[10px] font-bold text-stone-400">हजर (Present)</span>
              <span className="text-xs font-black text-emerald-400">🟢 {dailyStats.presentCount}/{staffMembers?.length || 0}</span>
            </div>

            <div className="bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-amber-500/30 flex items-center justify-between shadow-sm">
              <span className="text-[10px] font-bold text-stone-400">अर्धा दिवस (Half Day)</span>
              <span className="text-xs font-black text-amber-400">🟡 {dailyStats.halfDayCount}</span>
            </div>

            <div className="bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-red-500/30 flex items-center justify-between shadow-sm">
              <span className="text-[10px] font-bold text-stone-400">गैरहजर (Absent)</span>
              <span className="text-xs font-black text-red-400">🔴 {dailyStats.absentCount}</span>
            </div>

            <div className="bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-amber-600/30 flex items-center justify-between shadow-sm">
              <span className="text-[10px] font-bold text-stone-400">प्रमाण</span>
              <span className="text-xs font-black text-amber-300">⭐ {dailyStats.attendanceRate}%</span>
            </div>
          </div>

          {/* 2. Control Header (Single Compact Card) */}
          <div className="bg-stone-900 p-2 rounded-xl border border-stone-800 space-y-2 shadow-sm w-full max-w-full overflow-hidden">
            {/* View Mode Pills (Daily, Weekly, Monthly) */}
            <div className="grid grid-cols-3 bg-stone-955 p-0.5 rounded-lg border border-stone-800 gap-1 w-full">
              <button
                type="button"
                onClick={() => setAttendanceViewMode('daily')}
                className={`py-1 rounded-md text-[11px] font-bold transition text-center ${
                  attendanceViewMode === 'daily' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                दैनिक (Daily)
              </button>
              <button
                type="button"
                onClick={() => setAttendanceViewMode('weekly')}
                className={`py-1 rounded-md text-[11px] font-bold transition text-center ${
                  attendanceViewMode === 'weekly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                आठवडा (Weekly)
              </button>
              <button
                type="button"
                onClick={() => setAttendanceViewMode('monthly')}
                className={`py-1 rounded-md text-[11px] font-bold transition text-center ${
                  attendanceViewMode === 'monthly' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                महिना (Monthly)
              </button>
            </div>

            {/* Date & Action Controls (Single Compact Flex Row) */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
              {/* Date Input */}
              <div className="flex items-center gap-1 shrink-0">
                <label className="text-[11px] font-bold text-amber-400 whitespace-nowrap">तारीख:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-stone-950 border border-stone-800 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500 h-9 shadow-inner [color-scheme:dark] transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {attendanceViewMode === 'daily' && !isDateSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllPresent();
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    }}
                    className="px-2 py-1 h-8 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-[10px] sm:text-[11px] font-black flex items-center gap-1 transition shadow whitespace-nowrap"
                    title="सर्व कर्मचाऱ्यांना आज हजर नोंदवा"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>सर्व हजर</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={downloadAttendanceReportCsv}
                  className="p-1 rounded-lg bg-stone-955 hover:bg-stone-800 text-amber-300 border border-stone-700 flex items-center justify-center transition w-8 h-8 shrink-0"
                  title="हजेरी अहवाल डाऊनलोड करा (CSV)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                </button>

                {attendanceViewMode === 'daily' && (
                  <div className="shrink-0">
                    {isDateSubmitted ? (
                      <div className="flex items-center gap-1">
                        <span className="bg-emerald-950/80 text-emerald-400 px-2 py-1 h-8 rounded-lg text-[10px] font-extrabold border border-emerald-600/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>सेव्ह</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => unlockDailyAttendance(selectedDate)}
                          className="px-2 py-1 h-8 rounded-lg bg-stone-800 text-amber-300 text-[10px] font-bold border border-amber-600/40 flex items-center gap-1 transition"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>बदला</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          submitDailyAttendance(selectedDate);
                          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
                        }}
                        className="px-2.5 py-1 h-8 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[10px] sm:text-[11px] font-black flex items-center gap-1 shadow-sm transition whitespace-nowrap"
                      >
                        <Lock className="w-3 h-3" />
                        <span>हजेरी लॉक करा</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VIEW 1: DAILY ATTENDANCE REGISTER */}
          {attendanceViewMode === 'daily' && (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
              <div className="p-3.5 bg-stone-955 border-b border-stone-800 flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>हजेरी नोंदवही: <strong className="text-stone-100">{selectedDate}</strong></span>
                </span>
                {isDateSubmitted && (
                  <span className="text-[11px] font-bold text-emerald-400">
                    ही हजेरी सेव्ह झालेली आहे. बदल करण्यासाठी 'बदला' वर क्लिक करा.
                  </span>
                )}
              </div>

              {/* EMPTY STAFF RECORDS BANNER OR TABLES */}
              {(!filteredStaff || filteredStaff.length === 0) ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 bg-stone-900/40">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Users className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-extrabold text-stone-200">
                      कोणताही कर्मचारी रेकॉर्ड उपलब्ध नाही
                    </h3>
                    <p className="text-xs text-stone-400">
                      हजेरी नोंदवण्याकरिता प्रथम 'कर्मचारी' टॅबवर जाऊन नवीन कर्मचारी जोडा.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('directory')}
                    className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ नवीन कर्मचारी जोडा</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW (md+) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-955 text-amber-400 uppercase tracking-wider font-extrabold border-b border-stone-800">
                        <tr>
                          <th className="p-3.5">कर्मचारी नाव</th>
                          <th className="p-3.5">पद (Role)</th>
                          <th className="p-3.5">मोबाईल</th>
                          <th className="p-3.5">रोजंदारी (Daily Rate)</th>
                          <th className="p-3.5 text-center">हजेरी नोंद ({selectedDate})</th>
                          <th className="p-3.5 text-right">तपशील</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/80">
                        {(filteredStaff || []).map((staff) => {
                          const statusKey = `${selectedDate}_${staff.id}`;
                          const currentStatus = attendanceRecords?.[statusKey];

                          return (
                            <tr key={staff.id} className="hover:bg-stone-800/60 transition group">
                              <td className="p-3.5 font-bold text-stone-100 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 font-black flex items-center justify-center text-xs shadow shrink-0">
                                  {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <span className="text-sm font-extrabold text-stone-100">{staff.name}</span>
                              </td>
                              <td className="p-3.5">
                                <span className="bg-stone-950 text-amber-300 font-extrabold px-2.5 py-1 rounded-lg border border-stone-800 text-xs">
                                  {staff.role}
                                </span>
                              </td>
                              <td className="p-3.5 text-stone-300 font-mono font-bold">{staff.phone}</td>
                              <td className="p-3.5 font-black text-emerald-400 font-mono text-sm">₹{staff.dailyRate}/दिवस</td>
                              <td className="p-3.5">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Present */}
                                  <button
                                    disabled={isDateSubmitted}
                                    onClick={() => markAttendance(selectedDate, staff.id, 'P')}
                                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center gap-1 ${
                                      currentStatus === 'P'
                                        ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-400 scale-105'
                                        : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                                    }`}
                                  >
                                    🟢 P (हजर)
                                  </button>

                                  {/* Half Day */}
                                  <button
                                    disabled={isDateSubmitted}
                                    onClick={() => markAttendance(selectedDate, staff.id, 'HD')}
                                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center gap-1 ${
                                      currentStatus === 'HD'
                                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50 ring-2 ring-amber-400 scale-105'
                                        : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                                    }`}
                                  >
                                    🟡 HD (अर्धा)
                                  </button>

                                  {/* Absent */}
                                  <button
                                    disabled={isDateSubmitted}
                                    onClick={() => markAttendance(selectedDate, staff.id, 'A')}
                                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center gap-1 ${
                                      currentStatus === 'A'
                                        ? 'bg-red-500 text-white shadow-md shadow-red-950/50 ring-2 ring-red-400 scale-105'
                                        : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
                                    }`}
                                  >
                                    🔴 A (गैरहजर)
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => setInspectAbsentStaff(staff)}
                                  className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-400 text-xs font-bold border border-stone-800 transition flex items-center gap-1.5 ml-auto shadow"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span>गैरहजरी तारखा</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS VIEW (md:hidden) */}
                  <div className="md:hidden divide-y divide-stone-800/80">
                    {(filteredStaff || []).map((staff) => {
                      const statusKey = `${selectedDate}_${staff.id}`;
                      const currentStatus = attendanceRecords?.[statusKey];

                      return (
                        <div key={staff.id} className="p-4 space-y-3 bg-stone-900/60">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 font-black flex items-center justify-center text-sm shadow">
                                {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-stone-100 text-sm">{staff.name}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                                  <span className="bg-stone-955 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-stone-800">{staff.role}</span>
                                  <span className="text-emerald-400 font-black font-mono">₹{staff.dailyRate}/दिवस</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setInspectAbsentStaff(staff)}
                              className="p-2 rounded-xl bg-stone-955 text-amber-400 border border-stone-800"
                              title="गैरहजरी तारखा पहा"
                            >
                              <Eye className="w-4 h-4 text-amber-400" />
                            </button>
                          </div>

                          {/* Attendance Status Buttons Row */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            {/* Present */}
                            <button
                              disabled={isDateSubmitted}
                              onClick={() => markAttendance(selectedDate, staff.id, 'P')}
                              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center justify-center gap-1 ${
                                currentStatus === 'P'
                                  ? 'bg-emerald-500 text-stone-950 shadow-md ring-2 ring-emerald-400'
                                  : 'bg-stone-955 text-stone-400 border border-stone-800'
                              }`}
                            >
                              🟢 P (हजर)
                            </button>

                            {/* Half Day */}
                            <button
                              disabled={isDateSubmitted}
                              onClick={() => markAttendance(selectedDate, staff.id, 'HD')}
                              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center justify-center gap-1 ${
                                currentStatus === 'HD'
                                  ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
                                  : 'bg-stone-955 text-stone-400 border border-stone-800'
                              }`}
                            >
                              🟡 HD (अर्धा)
                            </button>

                            {/* Absent */}
                            <button
                              disabled={isDateSubmitted}
                              onClick={() => markAttendance(selectedDate, staff.id, 'A')}
                              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition disabled:opacity-80 flex items-center justify-center gap-1 ${
                                currentStatus === 'A'
                                  ? 'bg-red-500 text-white shadow-md ring-2 ring-red-400'
                                  : 'bg-stone-955 text-stone-400 border border-stone-800'
                              }`}
                            >
                              🔴 A (गैरहजर)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>
          )}

          {/* VIEW 2: WEEKLY ATTENDANCE REPORT */}
          {attendanceViewMode === 'weekly' && (
            <>
              {(!staffMembers || staffMembers.length === 0) ? (
                <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-extrabold text-stone-200">
                      आठवडा हजेरी हिशोबासाठी कोणताही कर्मचारी उपलब्ध नाही
                    </h3>
                    <p className="text-xs text-stone-400">
                      कर्मचाऱ्यांचा आठवडा अहवाल पहाण्याकरिता प्रथम नवीन कर्मचारी जोडा.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('directory')}
                    className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ नवीन कर्मचारी जोडा</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(staffMembers || []).map((staff) => {
                    const weekly = getEmployeeWeeklyAttendance(staff.id);
                    return (
                      <div key={staff.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                          <h4 className="font-extrabold text-stone-100 text-sm">{staff.name}</h4>
                          <span className="text-xs text-amber-300 font-bold bg-stone-950 px-2 py-0.5 rounded border border-stone-800">{staff.role}</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-stone-400">
                            <span>एकूण हजर दिवस (7 दिवसात):</span>
                            <strong className="text-emerald-400 font-black">{weekly.totalPresent} दिवस</strong>
                          </div>
                          <div className="flex justify-between text-stone-400">
                            <span>पूर्ण हजर दिवस (P):</span>
                            <strong className="text-emerald-300">{weekly.pCount} दिवस</strong>
                          </div>
                          <div className="flex justify-between text-stone-400">
                            <span>अर्धा दिवस (HD):</span>
                            <strong className="text-amber-400">{weekly.hdCount} दिवस</strong>
                          </div>
                          <div className="flex justify-between text-stone-400">
                            <span>गैरहजर दिवस (A):</span>
                            <strong className="text-red-400">{weekly.aCount} दिवस</strong>
                          </div>
                        </div>

                        {/* View Absent Dates Trigger */}
                        <button
                          type="button"
                          onClick={() => setInspectAbsentStaff(staff)}
                          className="w-full py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 border border-stone-800 transition"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>गैरहजरीच्या तारखा पहा ({weekly.aCount + weekly.hdCount})</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VIEW 3: MONTHLY ATTENDANCE MATRIX */}
          {attendanceViewMode === 'monthly' && (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h4 className="text-xs font-bold text-amber-300">
                  महिना हजेरी मॅट्रिक्स ({selectedDate.substring(0, 7)})
                </h4>
                <button
                  type="button"
                  onClick={downloadAttendanceReportCsv}
                  className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 flex items-center justify-center transition min-w-[32px] min-h-[32px]"
                  title="CSV डाऊनलोड करा"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

              {(!staffMembers || staffMembers.length === 0) ? (
                <div className="p-6 text-center flex flex-col items-center justify-center space-y-3 bg-stone-900/40">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-extrabold text-stone-200">
                      महिना हजेरी हिशोबासाठी कोणताही कर्मचारी उपलब्ध नाही
                    </h3>
                    <p className="text-xs text-stone-400">
                      कर्मचाऱ्यांचा मासिक हजेरी अहवाल पहाण्याकरिता प्रथम नवीन कर्मचारी जोडा.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('directory')}
                    className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ नवीन कर्मचारी जोडा</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(staffMembers || []).map((staff) => {
                    const payroll = getEmployeePayroll(staff.id);
                    const attendancePct = Math.min(100, Math.round((payroll.totalDaysCount / 30) * 100));

                    return (
                      <div key={staff.id} className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2.5">
                        <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                          <span className="font-bold text-stone-100 text-xs">{staff.name}</span>
                          <span className="text-[10px] font-black bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700/40">
                            {attendancePct}% हजेरी
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-emerald-950/40 border border-emerald-700/40 p-2 rounded-xl">
                            <span className="text-[10px] text-emerald-400 block font-bold">हजर</span>
                            <span className="font-black text-emerald-300">{payroll.presentDays}</span>
                          </div>
                          <div className="bg-amber-950/40 border border-amber-700/40 p-2 rounded-xl">
                            <span className="text-[10px] text-amber-400 block font-bold">अर्धा</span>
                            <span className="font-black text-amber-300">{payroll.halfDays}</span>
                          </div>
                          <div className="bg-red-950/40 border border-red-700/40 p-2 rounded-xl">
                            <span className="text-[10px] text-red-400 block font-bold">गैरहजर</span>
                            <span className="font-black text-red-300">{payroll.absentDays}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectAbsentStaff(staff)}
                          className="w-full py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-[11px] font-bold border border-stone-800 transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>गैरहजरीच्या तारखांची यादी</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* --- SUB TAB 2: PAYROLL & ADVANCE LEDGER --- */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-3">
          
          {/* Month Selector & Report Download Control Bar */}
          <div className="flex flex-row items-center justify-between gap-2 bg-stone-900 p-3.5 rounded-2xl border border-stone-800 shadow-lg">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-amber-400 whitespace-nowrap">महिना:</label>
              <input
                type="month"
                value={selectedDate.substring(0, 7)}
                onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
                className="bg-stone-950 border border-stone-700 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Icon-Only CSV Download Button */}
            <button
              type="button"
              onClick={downloadAttendanceReportCsv}
              className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 flex items-center justify-center transition min-w-[38px] min-h-[38px] shrink-0"
              title="पगार अहवाल डाऊनलोड करा (CSV)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* EMPTY STAFF RECORDS BANNER OR PAYROLL CARDS */}
          {(!staffMembers || staffMembers.length === 0) ? (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <IndianRupee className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-extrabold text-stone-200">
                  पगार हिशोबासाठी कोणताही कर्मचारी उपलब्ध नाही
                </h3>
                <p className="text-xs text-stone-400">
                  कर्मचाऱ्यांचा पगार व उचल (Advance) व्यवस्थापित करण्यासाठी प्रथम नवीन कर्मचारी जोडा.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('directory')}
                className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ नवीन कर्मचारी जोडा</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(staffMembers || []).map((staff) => {
                const payroll = getEmployeePayroll(staff.id);

                return (
                  <div key={staff.id} className={`bg-stone-900 border rounded-2xl p-4 space-y-3.5 shadow-lg transition ${payroll.isPaid ? 'border-emerald-600/50 bg-stone-900/90' : 'border-stone-800 hover:border-amber-600/40'}`}>
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <div>
                        <h3 className="text-sm font-extrabold text-stone-100">{staff.name}</h3>
                        <p className="text-[11px] text-amber-400 font-medium">{staff.role} • ₹{staff.monthlySalary}/महिना</p>
                      </div>

                      {payroll.isPaid ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                          ✅ पगार जमा केला
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold bg-stone-950 text-stone-400 px-2 py-0.5 rounded-lg border border-stone-800 font-mono">
                          {staff.phone}
                        </span>
                      )}
                    </div>

                    {/* Attendance Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold">एकूण हजर दिवस</span>
                        <span className="font-extrabold text-emerald-400 text-xs sm:text-sm">{payroll.totalDaysCount} दिवस</span>
                      </div>
                      <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold">कमावलेला पगार</span>
                        <span className="font-extrabold text-amber-400 text-xs sm:text-sm">₹{payroll.earnedSalary}</span>
                      </div>
                    </div>

                    {/* Advance & Net Payable */}
                    <div className="space-y-1 text-xs bg-stone-950 p-2.5 rounded-xl border border-amber-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[11px]">घेतलेली उचल (Advance):</span>
                        <span className="font-bold text-red-400 text-xs">₹{payroll.advanceTotal}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                        <span className="font-bold text-stone-200 text-xs">निव्वळ देय पगार:</span>
                        {payroll.isPaid ? (
                          <span className="font-black text-emerald-400 text-xs sm:text-sm">₹0 (पगार पूर्ण जमा)</span>
                        ) : (
                          <span className="font-black text-emerald-400 text-sm sm:text-base">₹{payroll.netPayable}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdvanceModalStaff(staff)}
                        disabled={payroll.isPaid}
                        className="py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 font-bold text-xs flex items-center justify-center gap-1 transition disabled:opacity-40"
                      >
                        <Banknote className="w-3.5 h-3.5 text-red-400" />
                        <span>+ उचल द्या</span>
                      </button>

                      {payroll.isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSalaryReceiptData({ staff, payroll: { ...payroll, netPayable: payroll.paidAmount }, month: selectedDate.substring(0, 7) });
                          }}
                          className="py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1 border border-emerald-600/50 shadow transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✅ पगार पावती</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            paySalary(staff.id, payroll.netPayable, selectedDate.substring(0, 7));
                            setSalaryReceiptData({ staff, payroll, month: selectedDate.substring(0, 7) });
                            confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
                          }}
                          disabled={payroll.netPayable <= 0}
                          className="py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow transition disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>💵 पगार द्या</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 3: STAFF DIRECTORY --- */}
      {activeSubTab === 'directory' && (
        <div className="space-y-3">
          
          {/* Top Control Header with Integrated Search & Add Action */}
          <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="कर्मचारी नाव किंवा नंबर शोधा..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 min-h-[38px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
              {staffMembers && staffMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(lang === 'mr' ? 'तुम्हाला खरोखर सर्व कर्मचारी डेटाबेस मधून पूर्णपणे हटवायचा आहे का?' : 'Are you sure you want to permanently clear ALL staff records from the database?')) {
                      clearAllStaffMembers();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-700/50 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow min-h-[38px] whitespace-nowrap"
                  title="सर्व स्टाफ डेटाबेस मधून हटवा"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>{lang === 'mr' ? 'यादी साफ करा' : 'Clear All'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({
                    name: '',
                    role: 'Waiter',
                    phone: '',
                    monthlySalary: 12000,
                    dailyRate: 400,
                    joiningDate: new Date().toISOString().split('T')[0]
                  });
                  setIsAddStaffOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition shadow min-h-[38px] whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ नवीन कर्मचारी जोडा</span>
              </button>
            </div>
          </div>

          {/* STAFF DIRECTORY GRID OR TABLE */}
          {(!filteredStaff || filteredStaff.length === 0) ? (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-extrabold text-stone-200">
                  कोणताही कर्मचारी आढळला नाही
                </h3>
                <p className="text-xs text-stone-400">
                  नवीन कर्मचाऱ्यांची नोंद करण्यासाठी '+ नवीन कर्मचारी जोडा' वर क्लिक करा.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
              {/* DESKTOP DIRECTORY TABLE (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-amber-400 uppercase tracking-wider font-extrabold border-b border-stone-800">
                    <tr>
                      <th className="p-3.5">नाव</th>
                      <th className="p-3.5">पद (Role)</th>
                      <th className="p-3.5">मोबाईल</th>
                      <th className="p-3.5">मासिक पगार</th>
                      <th className="p-3.5">रोजंदारी</th>
                      <th className="p-3.5 text-right">कृती (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {(filteredStaff || []).map((staff) => (
                      <tr key={staff.id} className="hover:bg-stone-800/50 transition">
                        <td className="p-3.5 font-bold text-stone-100">{staff.name}</td>
                        <td className="p-3.5">
                          <span className="bg-stone-800 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-stone-700">
                            {staff.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-400 font-mono">{staff.phone}</td>
                        <td className="p-3.5 font-bold text-amber-300">₹{staff.monthlySalary}/महिना</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{staff.dailyRate}/दिवस</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaff(staff);
                              setStaffForm({ ...staff });
                              setIsAddStaffOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(lang === 'mr' ? `तुम्हाला खरोखर '${staff.name}' यांना यादीतून पूर्णपणे काढून टाकायचे आहे का?` : `Are you sure you want to permanently delete '${staff.name}'?`)) {
                                deleteStaffMember(staff.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/50 text-red-400 transition"
                            title="कर्मचारी हटवा"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE DIRECTORY CARDS (md:hidden) */}
              <div className="md:hidden divide-y divide-stone-800">
                {(filteredStaff || []).map((staff) => (
                  <div key={staff.id} className="p-3.5 space-y-2 bg-stone-900/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-stone-100 text-base">{staff.name}</h4>
                        <p className="text-xs text-stone-400 font-mono mt-0.5">{staff.phone}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaff(staff);
                            setStaffForm({ ...staff });
                            setIsAddStaffOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-stone-800 text-amber-400 text-xs font-bold"
                          title="संपादित करा"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(lang === 'mr' ? `तुम्हाला खरोखर '${staff.name}' यांना यादीतून पूर्णपणे काढून टाकायचे आहे का?` : `Are you sure you want to permanently delete '${staff.name}'?`)) {
                              deleteStaffMember(staff.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-stone-800 text-red-400 text-xs font-bold"
                          title="हटवा"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/60">
                      <span className="bg-stone-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-stone-800">{staff.role}</span>
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="text-amber-300 font-bold">₹{staff.monthlySalary}/महिना</span>
                        <span className="text-emerald-400 font-bold">₹{staff.dailyRate}/दिवस</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: INSPECT ABSENT DATES LIST --- */}
      {inspectAbsentStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-400">{inspectAbsentStaff.name}</h3>
                <p className="text-xs text-stone-400">गैरहजरीच्या तारखांचा सविस्तर तपशील ({selectedDate.substring(0, 7)})</p>
              </div>
              <button
                onClick={() => setInspectAbsentStaff(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {getEmployeeAbsentDatesList(inspectAbsentStaff.id, selectedDate.substring(0, 7)).length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {getEmployeeAbsentDatesList(inspectAbsentStaff.id, selectedDate.substring(0, 7)).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-xs">
                    <span className="font-mono text-stone-200 font-bold">{item.date}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      item.type.includes('गैरहजर') ? 'bg-red-950 text-red-400 border border-red-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-emerald-400 font-bold bg-stone-950 rounded-2xl border border-stone-800">
                ✓ या महिन्यात हा कर्मचारी एकही दिवस गैरहजर राहिलेला नाही!
              </div>
            )}

            <button
              onClick={() => setInspectAbsentStaff(null)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition"
            >
              मागे जा (Close)
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT STAFF --- */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-amber-400">
              {editingStaff ? 'कर्मचारी माहिती एडिट करा' : '+ नवीन कर्मचारी नोंदणी'}
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">कर्मचारी नाव *</label>
                <input
                  type="text"
                  required
                  placeholder="कर्मचारी नाव..."
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">पद (Role)</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                  >
                    <option value="Waiter">वेटर (Waiter)</option>
                    <option value="Chef">आचारी (Chef/Cook)</option>
                    <option value="Manager">मॅनेजर (Manager)</option>
                    <option value="Helper">हेल्पर (Cleaner)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">मोबाईल नंबर *</label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    placeholder="१० अंकी मोबाईल नंबर..."
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">मासिक पगार (₹)</label>
                  <input
                    type="number"
                    value={staffForm.monthlySalary}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStaffForm({ ...staffForm, monthlySalary: val, dailyRate: Math.round(val / 30) });
                    }}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">रोजंदारी (₹/दिवस)</label>
                  <input
                    type="number"
                    value={staffForm.dailyRate}
                    onChange={(e) => setStaffForm({ ...staffForm, dailyRate: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700 transition"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow transition"
                >
                  सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RECORD ADVANCE --- */}
      {advanceModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-red-600/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-red-400 flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              <span>उचल नोंदवा ({advanceModalStaff.name})</span>
            </h3>

            <form onSubmit={handleRecordAdvanceSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">दिलेली उचल रक्कम (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="रक्कम टाका"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-red-300 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">कारण / टीप (पर्यायी)</label>
                <input
                  type="text"
                  placeholder="टीप टाका"
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalStaff(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700 transition"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-black text-xs shadow transition"
                >
                  उचल नोंदवा 💵
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SALARY RECEIPT / VOUCHER PRINT MODAL --- */}
      {salaryReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">

            {/* Top Right Close Button */}
            <button
              type="button"
              onClick={() => setSalaryReceiptData(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition border border-stone-700 shadow flex items-center justify-center"
              title="बंद करा (Exit)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pr-6">
              <span className="text-2xl">🚩</span>
              <h3 className="text-lg font-black text-amber-400">पगार पावती (Salary Voucher)</h3>
              <p className="text-xs text-stone-400">हॉटेल आराध्या डायनिंग • महिना: {salaryReceiptData.month}</p>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-400">कर्मचारी नाव:</span>
                <span className="font-bold text-stone-100">{salaryReceiptData.staff.name} ({salaryReceiptData.staff.role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">एकूण हजर दिवस:</span>
                <span className="font-bold text-emerald-400">{salaryReceiptData.payroll.totalDaysCount} दिवस</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">कमावलेला पगार:</span>
                <span className="font-bold text-amber-300">₹{salaryReceiptData.payroll.earnedSalary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">वजा उचल (Advance):</span>
                <span className="font-bold text-red-400">- ₹{salaryReceiptData.payroll.advanceTotal}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-800 text-sm">
                <span className="font-black text-stone-200">एकूण अदा पगार:</span>
                <span className="font-black text-emerald-400">₹{salaryReceiptData.payroll.netPayable}/-</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const phone = salaryReceiptData.staff.phone || '';
                    const cleanPhone = phone.replace(/\D/g, '');
                    if (!cleanPhone) {
                      alert(lang === 'mr' ? 'कर्मचाऱ्याचा मोबाईल नंबर उपलब्ध नाही' : 'Employee mobile number not available');
                      return;
                    }
                    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                    const msg = `🚩 *हॉटेल आराध्या डायनिंग - पगार पावती (Salary Slip)* 🚩%0A%0A*कर्मचारी:* ${encodeURIComponent(salaryReceiptData.staff.name)} (${salaryReceiptData.staff.role})%0A*महिना:* ${salaryReceiptData.month}%0A%0A*हजर दिवस:* ${salaryReceiptData.payroll.totalDaysCount} दिवस%0A*कमावलेला पगार:* ₹${salaryReceiptData.payroll.earnedSalary}%0A*वजा उचल (Advance):* ₹${salaryReceiptData.payroll.advanceTotal}%0A%0A*एकूण जमा पगार: ₹${salaryReceiptData.payroll.netPayable}/-*%0A%0Aधन्यवाद! 🙏`;
                    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msg}`, '_blank');
                  }}
                  className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>📱 WhatsApp पावती</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>पावती प्रिंट करा</span>
                </button>
              </div>

              {/* Bottom Full-Width Close/Exit Button */}
              <button
                type="button"
                onClick={() => setSalaryReceiptData(null)}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition"
              >
                <X className="w-4 h-4 text-stone-400" />
                <span>बंद करा (Exit)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
