export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      {/* Header */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Gráfica */}
      <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
      {/* Dos tablas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
