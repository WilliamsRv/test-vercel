export default function PositionWidget({ title, value, color = "blue", icon }) {
  const colorClasses = {
    blue: { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-500" },
    green: { border: "border-l-green-500", bg: "bg-green-50", text: "text-green-500" },
    red: { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-500" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white border-l-4 ${colors.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
