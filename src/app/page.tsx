import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: bodegas, error } = await supabase.from("bodegas").select("*");

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Ferretería MVP — Test de Conexión
        </h1>

        {error ? (
          <p className="text-red-600 font-medium mt-4">
            ✗ Error de conexión: {error.message}
          </p>
        ) : (
          <p className="text-green-600 font-medium mt-4">
            ✓ Conexión a Supabase exitosa
          </p>
        )}

        <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4">
          Bodegas en la base de datos
        </h2>

        {!error && bodegas && bodegas.length > 0 ? (
          <ul className="space-y-2">
            {bodegas.map((bodega: Record<string, unknown>, i: number) => (
              <li
                key={i}
                className="bg-white rounded-lg shadow px-4 py-3 text-gray-800"
              >
                {JSON.stringify(bodega)}
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <p className="text-gray-500 italic">
              No hay bodegas aún (esto es esperado, todavía no hemos cargado
              datos)
            </p>
          )
        )}
      </div>
    </div>
  );
}
