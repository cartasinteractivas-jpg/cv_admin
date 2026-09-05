// Configuración de Supabase
const SUPABASE_URL = "https://rrubzwdrsuyjntoejmew.supabase.co"; // Reemplaza con la URL de tu proyecto
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydWJ6d2Ryc3V5am50b2VqbWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDgxMzksImV4cCI6MjA4NzcyNDEzOX0.2skpmRdeb43Ck0IUAKyBcW5g3KAHPf7_st-QaAJ2K0E";          // Reemplaza con tu clave pública (anon key)

// Inicialización del cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ejemplo de prueba de conexión a la base de datos
async function verificarConexion() {
  try {
    // Reemplaza 'tu_tabla' por el nombre de alguna tabla en tu base de datos
    const { data, error } = await supabase.from('admin').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Error al conectar con Supabase:", error.message);
      actualizarEstadoBD(false);
    } else {
      console.log("Conexión exitosa a Supabase");
      actualizarEstadoBD(true);
    }
  } catch (err) {
    console.error("Excepción al conectar con Supabase:", err);
    actualizarEstadoBD(false);
  }
}

// Función auxiliar para actualizar los indicadores en tu interfaz
function actualizarEstadoBD(estaConectado) {
  const indicador = document.getElementById("estado-bd"); // Ajusta el ID según tu HTML
  if (indicador) {
    indicador.textContent = estaConectado ? "Online" : "Offline";
    indicador.style.color = estaConectado ? "green" : "red";
  }
}

// Ejecutar la verificación al cargar la página
document.addEventListener("DOMContentLoaded", verificarConexion);
