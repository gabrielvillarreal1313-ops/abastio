export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Botón volver */}
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      {/* Título */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Tabs placeholder */}
      <div className="flex gap-6 border-b border-gray-200 pb-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
