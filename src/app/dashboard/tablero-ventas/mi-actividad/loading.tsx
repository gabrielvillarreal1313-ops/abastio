export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Botón volver */}
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      {/* Título */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Tabla */}
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
