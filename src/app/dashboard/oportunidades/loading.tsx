export default function Loading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-8 w-52 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-1">
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
      {/* Filtros + tabla */}
      <div className="flex gap-3">
        <div className="h-9 w-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200 animate-pulse" />
        <div className="divide-y divide-gray-50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
