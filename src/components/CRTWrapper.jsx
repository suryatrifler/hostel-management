export default function CRTWrapper({ children }) {
  return (
    <div className="relative min-h-screen w-full bg-bg text-terminal font-vt323 overflow-hidden p-5 flex flex-col box-border">
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 z-50 opacity-20 bg-scanlines" />
      {/* Flicker */}
      <div className="pointer-events-none absolute inset-0 z-50 animate-flicker pointer-events-none shadow-[inset_0_0_5rem_rgba(0,0,0,0.6)]" />
      
      <div className="relative z-10 flex h-full flex-col flex-1">
        {children}
      </div>

      <style>{`
        .bg-scanlines {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                      linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 4px, 6px 100%;
        }
      `}</style>
    </div>
  )
}