# Electrolite

This is a light version of [Happergy](https://app.happergy.es)

## Estimación del PVPC de mañana

Si todavía no está disponible el fichero de precios de mañana, la aplicación intenta obtener los precios de OMIE y calcula una estimación horaria a partir del PVPC y del OMIE del día anterior:

`PVPC estimado = PVPC de ayer + peso diario × (OMIE de mañana − OMIE de ayer)`

El peso diario es del 75 % en 2024, del 60 % en 2025 y del 45 % desde 2026, según la implantación gradual de la señal a plazo del PVPC. La aplicación consume los precios horarios OMIE del fichero diario, sin consultar otras fuentes. La estimación se marca como simulada; no es el precio PVPC oficial ni una reproducción completa de su metodología. Al publicarse los datos oficiales, estos prevalecen.

La metodología y sus ponderaciones se describen en el [Real Decreto 446/2023](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2023-14048). Los datos proceden de OMIE y del archivo PVPC de [ESIOS](https://api.esios.ree.es/archives/70/download_json).

## Caché de precios

Los ficheros diarios `YYYYMMDD-pvpc.json` y `YYYYMMDD-omie.json` se guardan en `public/prices/`. Una GitHub Action se ejecuta cada hora y descarga únicamente los ficheros que falten para hoy y mañana; al inicializar el proceso obtiene también los datos de hoy. Cuando se crea algún fichero nuevo, se eliminan los ficheros diarios de otras fechas y se conservan los de hoy y mañana. La acción confirma los cambios en el repositorio y despliega la aplicación para publicarlos. OMIE se descarga y transforma de CSV a precios horarios JSON; PVPC se reduce a los campos `Dia`, `Hora`, `PCB`, `PMHPCB` y `TAHPCB`, necesarios para mostrar y estimar los precios. La aplicación consulta primero IndexedDB y, si no encuentra datos, el JSON local publicado. No consulta OMIE ni ESIOS directamente desde el navegador. Las respuestas vacías o incompletas se conservan en IndexedDB durante 30 minutos antes de volver a intentarlo; las peticiones simultáneas de la misma fecha se agrupan.

La caché es local a cada navegador. Para compartirla entre usuarios y reducir globalmente las consultas a OMIE/ESIOS haría falta un proxy o caché en servidor con una política de caducidad equivalente.

La aplicación sigue el tema claro u oscuro del sistema por defecto. El botón de tema permite elegir uno manualmente y la preferencia se guarda en IndexedDB.
