import React, { useState, useEffect } from 'react';

const LOG_SEQUENCE = (branch) => [
  ">> INITIATING HOUSING PROTOCOL V2.4...",
  ">> FETCHING ACADEMIC RECORDS...",
  ">> VERIFYING REGISTRATION STATUS... [OK]",
  `>> DETECTED BRANCH: ${branch || 'GENERAL'}...`,
  ">> CALCULATING BLOCK ALLOCATION...",
  ">> ALLOCATION CONFIRMED: BLOCK A [BOYS]...",
  ">> ESTABLISHING SATELLITE VISUAL FEED...",
  ">> UPLINK SUCCESSFUL."
];

export default function BookingLoader({ branch, onComplete }) {
  const [logs, setLogs] = useState([]);
  const fullLogs = LOG_SEQUENCE(branch);

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < fullLogs.length) {
        setLogs((prev) => [...prev, fullLogs[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        // Wait a moment after the last log, then finish
        setTimeout(onComplete, 1000); 
      }
    }, 800); // Add a new line every 800ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center font-vt323 p-4">
      <div className="w-full max-w-2xl">
        <div className="border-b-2 border-terminal mb-4 pb-2 flex justify-between">
            <span className="text-terminal text-xl">SYSTEM_PROCESS :: ALLOCATION</span>
            <span className="animate-pulse text-terminal">PROCESSING...</span>
        </div>
        
        <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar flex flex-col justify-end">
          {logs.map((log, i) => (
            <div key={i} className="text-2xl text-terminal opacity-90">
              {log}
            </div>
          ))}
          <div className="text-2xl text-terminal animate-blink">_</div>
        </div>

        {/* Fake Progress Bar */}
        <div className="w-full h-2 bg-terminal/20 mt-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-terminal animate-[loading_6s_ease-in-out_forwards] w-full origin-left" />
        </div>
      </div>
    </div>
  );
}