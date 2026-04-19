export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      {/* Header */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Info header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      {/* Tabla de líneas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200 animate-pulse" />
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-white animate-pulse" />
          ))}
        </div>
      </div>
      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <div className="h-10 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
