import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

const A25J_CODIGO = 'A25J'
const PRECIO_LISTA = 550000

const ITEMS = [
  // SECCIÓN 1 — FIJO
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH82001', descripcion:'Carrocería estándar sin placa de desgaste', precio_fob:26137, precio_lista:38004, orden:65 },
  { tipo:'fijo', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH22002', descripcion:'Guardabarros delanteros, neumáticos estándar', precio_fob:210, precio_lista:305, orden:11 },
  { tipo:'fijo', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH23003', descripcion:'Faldones de barro, tren de rodaje, neumáticos estándar', precio_fob:508, precio_lista:739, orden:12 },
  { tipo:'fijo', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH42009', descripcion:'Asiento ISRI Premium, cinturón 2 puntos', precio_fob:1947, precio_lista:2831, orden:13 },
  { tipo:'fijo', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH80003', descripcion:'Sellado de transporte', precio_fob:7, precio_lista:10, orden:14 },
  // SECCIÓN 2 — DROPDOWN NEUMÁTICOS (default=AH20037)
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:true, seccion:null, codigo:'AH20037', descripcion:'Neumáticos MI 23.5R25 XADN (E3)', precio_fob:21265, precio_lista:30920, orden:20 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20032', descripcion:'Neumáticos BR 23.5R25 VLT (E3)', precio_fob:14631, precio_lista:21274, orden:21 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20033', descripcion:'Neumáticos BR 23.5R25 VLT-S (E4)', precio_fob:16094, precio_lista:23401, orden:22 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20034', descripcion:'Neumáticos GY 23.5R25 TL-3A+ (E3)', precio_fob:20812, precio_lista:30262, orden:23 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20059', descripcion:'Neumáticos GY 23.5R25 GP4D (E4)', precio_fob:19600, precio_lista:28499, orden:24 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20042', descripcion:'Neumáticos BR 750/65R25 VLT (E3)', precio_fob:24126, precio_lista:35080, orden:25 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20058', descripcion:'Neumáticos GY 750/65R25 TL3A+ (E3)', precio_fob:26779, precio_lista:38939, orden:26 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20044', descripcion:'Neumáticos MI 750/65R25 XAD65-1 (E3)', precio_fob:27693, precio_lista:40267, orden:27 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20063', descripcion:'Neumáticos BR 750/65R25 VLT-S (E4)', precio_fob:32669, precio_lista:47502, orden:28 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20071', descripcion:'Neumáticos MI 23.5R25 Xtra Defend (E4)', precio_fob:31690, precio_lista:46079, orden:29 },
  { tipo:'dropdown', grupo_dropdown:'Neumáticos', es_default:false, seccion:null, codigo:'AH20075', descripcion:'Neumáticos MI 750/65R25 Xtra Defend (E4)', precio_fob:31351, precio_lista:45586, orden:30 },
  // SECCIÓN 2 — DROPDOWN AROS (default=AH21010)
  { tipo:'dropdown', grupo_dropdown:'Aros', es_default:true, seccion:null, codigo:'AH21010', descripcion:'Aros 23.5R25', precio_fob:11262, precio_lista:16375, orden:35 },
  { tipo:'dropdown', grupo_dropdown:'Aros', es_default:false, seccion:null, codigo:'AH21011', descripcion:'Aros 750/65 R25', precio_fob:13496, precio_lista:19624, orden:36 },
  // SECCIÓN 2 — DROPDOWN FLUIDO HIDRÁULICO (default=AH60002 precio=0)
  { tipo:'dropdown', grupo_dropdown:'Fluido Hidráulico', es_default:true, seccion:null, codigo:'AH60002', descripcion:'Fluido hidráulico estándar (clima cálido)', precio_fob:0, precio_lista:0, orden:40 },
  { tipo:'dropdown', grupo_dropdown:'Fluido Hidráulico', es_default:false, seccion:null, codigo:'AH60001', descripcion:'Fluido hidráulico biodegradable', precio_fob:2412, precio_lista:3507, orden:41 },
  // SECCIÓN 2 — CHECKBOXES DE SERIE CONFIGURABLES
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH31005', descripcion:'Filtro de aire, alta capacidad', precio_fob:374, precio_lista:544, orden:50 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH31006', descripcion:'Temporizador de apagado de motor', precio_fob:150, precio_lista:218, orden:51 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH31012', descripcion:'Apagado automático de motor', precio_fob:150, precio_lista:218, orden:52 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH41007', descripcion:'Manual de anclaje', precio_fob:71, precio_lista:103, orden:53 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH41011', descripcion:'Llave universal', precio_fob:176, precio_lista:256, orden:54 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH44000', descripcion:'Software de pesaje a bordo', precio_fob:6375, precio_lista:9270, orden:55 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH44001', descripcion:'Radio', precio_fob:899, precio_lista:1307, orden:56 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH50003', descripcion:'Sistema de visión trasera, cámara', precio_fob:1607, precio_lista:2337, orden:57 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH50011', descripcion:'Espejos retrovisores eléctricos con calefacción', precio_fob:486, precio_lista:707, orden:58 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH50014', descripcion:'Alarma de reversa, ruido blanco', precio_fob:427, precio_lista:621, orden:59 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH50024', descripcion:'Unidad satelital', precio_fob:409, precio_lista:595, orden:60 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH51008', descripcion:'Luces de trabajo LED', precio_fob:1877, precio_lista:2729, orden:61 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH51012', descripcion:'Baliza de advertencia LED', precio_fob:406, precio_lista:590, orden:62 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH71006', descripcion:'Herramientas de izaje', precio_fob:2112, precio_lista:3071, orden:63 },
  { tipo:'configurable', grupo_dropdown:null, es_default:true, seccion:null, codigo:'AH83001', descripcion:'Placas de desgaste', precio_fob:13526, precio_lista:19667, orden:64 },
  // SECCIÓN 3 — DROPDOWNS SIN DEFAULT
  { tipo:'dropdown', grupo_dropdown:'Limitador de velocidad', es_default:false, seccion:'Limitador de velocidad', codigo:'AH38001', descripcion:'Limitador de velocidad 25 km/h', precio_fob:1184, precio_lista:1722, orden:100 },
  { tipo:'dropdown', grupo_dropdown:'Limitador de velocidad', es_default:false, seccion:'Limitador de velocidad', codigo:'AH38002', descripcion:'Limitador de velocidad 30 km/h', precio_fob:1184, precio_lista:1722, orden:101 },
  { tipo:'dropdown', grupo_dropdown:'Filtro de cabina', es_default:false, seccion:'Confort de cabina', codigo:'AH41015', descripcion:'Filtro contra polvo de asbesto', precio_fob:31, precio_lista:45, orden:130 },
  { tipo:'dropdown', grupo_dropdown:'Filtro de cabina', es_default:false, seccion:'Confort de cabina', codigo:'AH41038', descripcion:'Filtro de aire de carbón activo', precio_fob:95, precio_lista:138, orden:131 },
  { tipo:'dropdown', grupo_dropdown:'Asiento adicional', es_default:false, seccion:'Asiento', codigo:'AH42008', descripcion:'Asiento básico GRAMMER, cinturón 2 puntos', precio_fob:2051, precio_lista:2982, orden:140 },
  { tipo:'dropdown', grupo_dropdown:'Asiento adicional', es_default:false, seccion:'Asiento', codigo:'AH42010', descripcion:'Asiento ISRI Premium, cinturón 3 puntos', precio_fob:2462, precio_lista:3580, orden:141 },
  { tipo:'dropdown', grupo_dropdown:'Iluminación adicional', es_default:false, seccion:'Eléctrico', codigo:'AH51011', descripcion:'Faros LED adicionales', precio_fob:1502, precio_lista:2184, orden:170 },
  { tipo:'dropdown', grupo_dropdown:'Iluminación adicional', es_default:false, seccion:'Eléctrico', codigo:'AH51013', descripcion:'Indicador externo de cinturón de seguridad', precio_fob:104, precio_lista:151, orden:171 },
  { tipo:'dropdown', grupo_dropdown:'Calentador hidráulico', es_default:false, seccion:'Hidráulico', codigo:'AH61008', descripcion:'Calentador de tanque hidráulico 230V', precio_fob:210, precio_lista:305, orden:180 },
  { tipo:'dropdown', grupo_dropdown:'Calentador hidráulico', es_default:false, seccion:'Hidráulico', codigo:'AH61009', descripcion:'Calentador de tanque hidráulico 120V', precio_fob:210, precio_lista:305, orden:181 },
  { tipo:'dropdown', grupo_dropdown:'Lubricación', es_default:false, seccion:'Hidráulico', codigo:'AH72006', descripcion:'Lubricación centralizada sin cable en compuerta', precio_fob:221, precio_lista:321, orden:182 },
  { tipo:'dropdown', grupo_dropdown:'Lubricación', es_default:false, seccion:'Hidráulico', codigo:'AH72007', descripcion:'Lubricación automática sin cable en compuerta', precio_fob:2401, precio_lista:3491, orden:183 },
  { tipo:'dropdown', grupo_dropdown:'Señalización', es_default:false, seccion:'Otros', codigo:'AH81006', descripcion:'Señal 50 km/h', precio_fob:40, precio_lista:58, orden:220 },
  { tipo:'dropdown', grupo_dropdown:'Señalización', es_default:false, seccion:'Otros', codigo:'AH81007', descripcion:'Señal 30 km/h', precio_fob:74, precio_lista:108, orden:221 },
  // SECCIÓN 3 — CHECKBOXES OPCIONALES
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Tolva', codigo:'AH82003', descripcion:'Chasis sin tolva', precio_fob:1314, precio_lista:1911, orden:80 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83003', descripcion:'Extensión lateral 200mm', precio_fob:4456, precio_lista:6479, orden:85 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83004', descripcion:'Compuerta trasera voladiza, por cable', precio_fob:8253, precio_lista:12000, orden:86 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83005', descripcion:'Calefacción de tolva por escape', precio_fob:1563, precio_lista:2273, orden:87 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83006', descripcion:'Guardaderrames frontal adicional', precio_fob:2748, precio_lista:3996, orden:88 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83008', descripcion:'Compuerta trasera colgante', precio_fob:9097, precio_lista:13227, orden:89 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de tolva', codigo:'AH83012', descripcion:'Placas de desgaste HD', precio_fob:22672, precio_lista:32965, orden:90 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31001', descripcion:'Parada de emergencia externa del motor', precio_fob:179, precio_lista:260, orden:108 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31003', descripcion:'Calentador de motor 120V', precio_fob:343, precio_lista:499, orden:109 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31004', descripcion:'Sistema de combustible rápido', precio_fob:1605, precio_lista:2334, orden:110 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31007', descripcion:'Alta velocidad en ralentí', precio_fob:164, precio_lista:239, orden:111 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31008', descripcion:'Calentador de motor 240V', precio_fob:833, precio_lista:1211, orden:112 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31017', descripcion:'Calentador de motor a diésel', precio_fob:343, precio_lista:499, orden:113 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Equipamiento de motor', codigo:'AH31018', descripcion:'Filtro de combustible calefaccionado -25C', precio_fob:343, precio_lista:499, orden:114 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41012', descripcion:'Persianas laterales', precio_fob:554, precio_lista:806, orden:120 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41014', descripcion:'Toma eléctrica 240V cabina', precio_fob:201, precio_lista:292, orden:121 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41021', descripcion:'Limpiaparabrisas/lavador trasero', precio_fob:382, precio_lista:556, orden:122 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41028', descripcion:'Temporizador calefaccion/ventilacion cabina', precio_fob:225, precio_lista:327, orden:123 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41029', descripcion:'Apoyabrazos, asiento GRAMMER', precio_fob:56, precio_lista:81, orden:124 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41033', descripcion:'Pistola de aire', precio_fob:315, precio_lista:458, orden:125 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41036', descripcion:'Cenicero', precio_fob:105, precio_lista:153, orden:126 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Confort de cabina', codigo:'AH41037', descripcion:'Apoyabrazos, asiento ISRI', precio_fob:182, precio_lista:265, orden:127 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Aplicaciones Volvo Co-Pilot', codigo:'AH44004', descripcion:'Monitoreo de presión de neumáticos (TPMS)', precio_fob:2057, precio_lista:2991, orden:150 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Eléctrico', codigo:'AH50013', descripcion:'Interfaz CAN-BUS', precio_fob:149, precio_lista:217, orden:160 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Eléctrico', codigo:'AH50019', descripcion:'Conector de arranque auxiliar tipo ISO', precio_fob:840, precio_lista:1222, orden:161 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Eléctrico', codigo:'AH50020', descripcion:'Interfaz PDS Safemine', precio_fob:210, precio_lista:305, orden:162 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Eléctrico', codigo:'AH50022', descripcion:'Cámara frontal', precio_fob:406, precio_lista:590, orden:163 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Protección', codigo:'AH70001', descripcion:'Tacos de rueda', precio_fob:1291, precio_lista:1878, orden:190 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Protección', codigo:'AH70006', descripcion:'Sistema Volvo de supresion de incendios', precio_fob:3220, precio_lista:4682, orden:191 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Protección', codigo:'AH70007', descripcion:'Extintor de incendios', precio_fob:85, precio_lista:124, orden:192 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Protección', codigo:'AH70008', descripcion:'Soporte extintor externo', precio_fob:61, precio_lista:89, orden:193 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81004', descripcion:'Kit de reflexivos viales', precio_fob:31, precio_lista:45, orden:210 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81008', descripcion:'Señal SMV (vehículo de baja velocidad)', precio_fob:47, precio_lista:68, orden:211 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81009', descripcion:'Triángulo de advertencia', precio_fob:87, precio_lista:127, orden:212 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81011', descripcion:'Kit de reducción de ruido', precio_fob:639, precio_lista:930, orden:213 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81014', descripcion:'Dirección de emergencia en reversa', precio_fob:806, precio_lista:1172, orden:214 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81015', descripcion:'Kit para climas fríos', precio_fob:3045, precio_lista:4427, orden:215 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81018', descripcion:'Tanque de aire certificado ASME', precio_fob:1841, precio_lista:2677, orden:216 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81019', descripcion:'Gancho de remolque', precio_fob:378, precio_lista:550, orden:217 },
  { tipo:'configurable', grupo_dropdown:null, es_default:false, seccion:'Otros', codigo:'AH81029', descripcion:'Extensión de bogie', precio_fob:584, precio_lista:850, orden:218 },
]

export async function GET() {
  const supabase = createAdminSupabase()
  const { data: modelo, error: mErr } = await supabase
    .from('modelos').select('id').eq('codigo', A25J_CODIGO).single()
  if (mErr || !modelo) return NextResponse.json({ error: 'Modelo A25J no encontrado' }, { status: 404 })
  await supabase.from('modelos').update({ precio_lista: PRECIO_LISTA }).eq('id', modelo.id)
  await supabase.from('items').delete().eq('modelo_id', modelo.id)
  const rows = ITEMS.map(it => ({ ...it, modelo_id: modelo.id, activo: true }))
  const { data, error } = await supabase.from('items').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: data.length, modeloId: modelo.id })
}
