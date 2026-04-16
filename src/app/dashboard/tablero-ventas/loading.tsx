export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Sección oportunidades */}
      <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
      {/* Sección cotizaciones */}
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mt-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
      {/* Sección clientes riesgo */}
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mt-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
