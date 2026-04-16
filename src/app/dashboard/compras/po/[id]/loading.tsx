export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Botón volver */}
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      {/* Título + badges */}
      <div>
        <div className="h-7 w-96 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-3 w-64 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Banner revisor */}
      <div className="h-16 bg-gray-50 rounded-lg animate-pulse" />
      {/* Tabla de líneas */}
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-11 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
