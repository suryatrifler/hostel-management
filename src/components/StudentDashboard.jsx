import React from 'react';
import { 
  User, BookOpen, CreditCard, Printer, 
  FileText, Download, CheckSquare, 
  LogOut, Home, AlertTriangle
} from 'lucide-react';

export default function StudentDashboard({ 
    onLogout, 
    student, 
    onHostelClick, 
    onDetailsClick,
    onResultsClick,
    onOpenModal,
    onGrievanceClick 
}) {
  
  const studentName = student?.full_name || "UNKNOWN STUDENT";
  const studentId = student?.registration_number || "-------";
  const branchInfo = student ? `${student.course} - ${student.branch}` : "N/A";

  const menuItems = [
    // ROW 1
    { title: "Bio-Data Scan", icon: <User />, color: "text-cyan-400", border: "border-cyan-400", action: onDetailsClick },
    { title: "Academic Results", icon: <CheckSquare />, color: "text-green-400", border: "border-green-400", action: onResultsClick },
    { title: "Backlog Subjects", icon: <BookOpen />, color: "text-red-400", border: "border-red-400", action: () => onOpenModal && onOpenModal('backlogs') },
    
    // ROW 2
    { 
        title: "Exam Registration", 
        icon: <BookOpen />, 
        color: "text-green-400", 
        border: "border-green-400",
        // FIX: Matches 'exam_reg' in TerminalHome
        action: () => onOpenModal && onOpenModal('exam_reg') 
    },
    { title: "Download Hall-Ticket", icon: <Download />, color: "text-blue-400", border: "border-blue-400", action: () => onOpenModal && onOpenModal('hall_ticket') },
    { title: "Hostel Status", icon: <Home />, color: "text-green-400", border: "border-green-400", action: onHostelClick },

    // ROW 3
    { title: "Challan Generation", icon: <FileText />, color: "text-blue-400", border: "border-blue-400", action: () => onOpenModal && onOpenModal('challan_gen') }, // Placeholder
    { title: "Challan Payment", icon: <CreditCard />, color: "text-blue-400", border: "border-blue-400", action: () => onOpenModal && onOpenModal('payment_history') },
    { title: "Payment Status", icon: <FileText />, color: "text-yellow-400", border: "border-yellow-400", action: () => onOpenModal && onOpenModal('payment_history') },

    // ROW 4
    { title: "Grievance Terminal", icon: <AlertTriangle />, color: "text-red-400", border: "border-red-400", action: onGrievanceClick },
    { 
        title: "Tuition Fees", 
        icon: <FileText />, 
        color: "text-cyan-400", 
        border: "border-cyan-400",
        // FIX: Matches 'tuition' in TerminalHome
        action: () => onOpenModal && onOpenModal('tuition')
    },
    { title: "Print Receipt", icon: <Printer />, color: "text-red-400", border: "border-red-400", action: () => window.print() },
  ];

  return (
    <div className="w-full h-full flex flex-col animate-[slideIn_0.5s_ease-out] overflow-hidden">
      
      {/* Command Strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-terminal/10 border-y-2 border-terminal p-3 mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-terminal animate-pulse"></span>
          <span className="text-terminal font-bold tracking-wider">SYSTEM READY <span className="animate-blink">_</span></span>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 w-full md:w-auto">
          <div className="text-right">
            <div className="text-terminal font-bold leading-none uppercase">{studentName}</div>
            <div className="text-terminal/60 text-sm leading-none mt-1">ID: {studentId} | {branchInfo}</div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-500/50 px-4 py-1 hover:bg-red-500 hover:text-black transition-all">
            <LogOut size={16} /> [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => item.action ? item.action() : alert("MODULE OFFLINE")}
            className={`
              relative group flex flex-col items-center justify-center p-2 h-full w-full
              border ${item.border} ${item.color}
              bg-black/40 hover:bg-white/5 transition-all duration-200
              hover:shadow-[0_0_15px_currentColor] backdrop-blur-sm
            `}
          >
            <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${item.border}`} />
            <div className={`absolute top-0 right-0 w-1 h-1 border-t border-r ${item.border}`} />
            <div className={`absolute bottom-0 left-0 w-1 h-1 border-b border-l ${item.border}`} />
            <div className={`absolute bottom-0 right-0 w-1 h-1 border-b border-r ${item.border}`} />

            <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-200">
              {React.cloneElement(item.icon, { size: 24 })}
            </div>
            <span className="text-base font-vt323 tracking-wide uppercase text-center leading-tight opacity-90 group-hover:opacity-100">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}