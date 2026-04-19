export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200 animate-pulse" />
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
