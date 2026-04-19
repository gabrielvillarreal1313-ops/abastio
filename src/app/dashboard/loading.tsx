export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards (5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Gráfica */}
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse mt-10" />
      {/* Secciones de tabla */}
      <div className="mt-10 space-y-3">
        <div className="h-6 w-72 bg-gray-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
      <div className="mt-10 space-y-3">
        <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
