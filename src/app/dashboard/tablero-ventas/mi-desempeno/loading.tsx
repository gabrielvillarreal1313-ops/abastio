export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Gráfica */}
      <div className="bg-gray-50 rounded-lg animate-pulse h-80" />
      {/* Tablas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
