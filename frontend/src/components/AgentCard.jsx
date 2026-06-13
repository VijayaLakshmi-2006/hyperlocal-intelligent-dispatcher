export default function AgentCard({ agent }) {
  if (!agent) return null

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-50 rounded-full blur-xl pointer-events-none"></div>

      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white">
          {agent.user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${agent.isAvailable === false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      </div>

      <div className="flex-1 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{agent.user?.name || 'Delivery Agent'}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span className="text-lg">🏍️</span> {agent.vehicleType === 'bike' ? 'Two Wheeler' : agent.vehicleType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${agent.user?.phone}`} 
              className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm"
              title="Call Agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </a>
            <button
              onClick={() => alert(`Messaging ${agent.user?.name}...`)}
              className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"
              title="Message Agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
