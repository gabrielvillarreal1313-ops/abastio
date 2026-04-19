export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      {/* Header */}
      <div>
        <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-1">
        <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Gráfica */}
      <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
      {/* Tabla top SKUs */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
