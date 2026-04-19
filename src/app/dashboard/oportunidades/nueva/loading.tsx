export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
      {/* Título */}
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      {/* Stepper */}
      <div className="flex items-center gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Formulario */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Acciones */}
      <div className="flex justify-between">
        <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
