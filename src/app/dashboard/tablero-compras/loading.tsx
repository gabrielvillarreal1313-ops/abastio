export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Título + subtítulo */}
      <div>
        <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Sección POs */}
      <div className="h-6 w-80 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-36 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Tabla */}
      <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mt-4" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
