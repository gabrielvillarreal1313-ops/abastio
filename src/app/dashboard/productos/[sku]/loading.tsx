export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      {/* Header */}
      <div>
        <div className="h-8 w-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Gráfica + inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      {/* Top clientes */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
