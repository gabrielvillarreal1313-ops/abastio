export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Tabs placeholder */}
      <div className="flex gap-6 border-b border-gray-200 pb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      {/* Filtros */}
      <div className="flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Tabla */}
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
