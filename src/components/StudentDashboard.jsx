import React from 'react';
import { 
  User, BookOpen, CreditCard, Printer, 
  FileText, Download, CheckSquare, MessageSquare, 
  LogOut, Home, AlertTriangle
} from 'lucide-react';

export default function StudentDashboard({ 
    onLogout, 
    student, 
    onHostelClick, 
    onGrievanceClick, 
    onDetailsClick,
    onOpenModal // Generic handler for other modals (exams, results, etc.)
}) {
  
  const studentName = student?.full_name || "UNKNOWN STUDENT";
  const studentId = student?.registration_number || "-------";
  const branchInfo = student ? `${student.course} - ${student.branch}` : "N/A";

  const menuItems = [
    // 1. UPDATED: Triggers the 3D Bio-Scan Modal
    { 
        title: "Bio-Data Scan", 
        icon: <User />, 
        color: "text-cyan-400", 
        border: "border-cyan-400",
        action: onDetailsClick 
    },
    
    // 2. Generic Modals
    { 
        title: "Exam Registration", 
        icon: <BookOpen />, 
        color: "text-green-400", 
        border: "border-green-400",
        action: () => onOpenModal && onOpenModal('exam')
    },
    
    // 3. Placeholders
    { title: "Challan Generation", icon: <CreditCard />, color: "text-blue-400", border: "border-blue-400" },
    
    // 4. UPDATED: Triggers Payment History Table
    { 
        title: "Payment History", 
        icon: <FileText />, 
        color: "text-yellow-400", 
        border: "border-yellow-400",
        action: () => onOpenModal && onOpenModal('payment_history')
    },
    
    { title: "Tuition Fees", icon: <FileText />, color: "text-cyan-400", border: "border-cyan-400" },
    { title: "Print Receipt", icon: <Printer />, color: "text-red-400", border: "border-red-400" },
    
    // 7. Generic Modals
    { 
        title: "Download Hall-Ticket", 
        icon: <Download />, 
        color: "text-blue-400", 
        border: "border-blue-400",
        action: () => onOpenModal && onOpenModal('hall_ticket')
    },
    
    { 
        title: "Academic Results", 
        icon: <CheckSquare />, 
        color: "text-green-400", 
        border: "border-green-400",
        action: () => onOpenModal && onOpenModal('results')
    },
    
    // 9. Hostel Action
    { 
      title: "Hostel Status", 
      icon: <Home />, 
      color: "text-green-400", 
      border: "border-green-400",
      action: onHostelClick 
    },
    
    { title: "Backlog Subjects", icon: <BookOpen />, color: "text-green-400", border: "border-green-400" },
    
    // 11. UPDATED: Triggers Grievance Terminal
    { 
        title: "Grievance Terminal", 
        icon: <AlertTriangle />, 
        color: "text-red-400", 
        border: "border-red-400",
        action: onGrievanceClick 
    },
    
    { title: "General Feedback", icon: <MessageSquare />, color: "text-yellow-400", border: "border-yellow-400" },
  ];

  return (
    <div className="w-full h-full flex flex-col animate-[slideIn_0.5s_ease-out]">
      
      {/* Command Strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-terminal/10 border-y-2 border-terminal p-3 mb-6 gap-4">
        
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-terminal animate-pulse"></span>
          <span className="text-terminal font-bold tracking-wider">
            SYSTEM READY <span className="animate-blink">_</span>
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 w-full md:w-auto">
          <div className="text-right">
            <div className="text-terminal font-bold leading-none uppercase">{studentName}</div>
            <div className="text-terminal/60 text-sm leading-none mt-1">
                ID: {studentId} | {branchInfo}
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-500/50 px-4 py-1 hover:bg-red-500 hover:text-black transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.6)]"
          >
            <LogOut size={16} /> [ LOGOUT ]
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
                if (item.action) {
                    item.action();
                } else {
                    // Fallback for unconnected buttons
                    alert("MODULE OFFLINE :: CONNECTING...");
                }
            }}
            className={`
              relative group flex flex-col items-center justify-center p-6 h-32
              border ${item.border} ${item.color}
              bg-black/40 hover:bg-white/5 transition-all duration-200
              hover:shadow-[0_0_15px_currentColor] hover:-translate-y-1
              backdrop-blur-sm
            `}
          >
            <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${item.border}`} />
            <div className={`absolute top-0 right-0 w-1 h-1 border-t border-r ${item.border}`} />
            <div className={`absolute bottom-0 left-0 w-1 h-1 border-b border-l ${item.border}`} />
            <div className={`absolute bottom-0 right-0 w-1 h-1 border-b border-r ${item.border}`} />

            <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              {item.icon}
            </div>

            <span className="text-lg font-vt323 tracking-wide uppercase text-center leading-tight opacity-90 group-hover:opacity-100">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}