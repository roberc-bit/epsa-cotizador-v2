import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabase } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'cotizador@epsa.com.ar'

function fmt(n: number) { return 'USD ' + Math.round(n).toLocaleString('es-AR') }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    emailCliente, nombreCliente, emailVendedor,
    modeloNombre, modeloCodigo, itemsJson,
    precioBase, precioTotal, descuentoPct, precioFinal, userId,
    modeloId,
  } = body

  const supabase = await createServerSupabase()

  // Guardar cotización en BD
  const { data: cot, error: dbErr } = await supabase
    .from('cotizaciones')
    .insert({
      usuario_id: userId,
      modelo_id: modeloId,
      cliente_nombre: nombreCliente,
      cliente_email: emailCliente,
      items_json: itemsJson,
      precio_base: precioBase,
      precio_total: precioTotal,
      descuento_pct: descuentoPct,
      precio_final: precioFinal,
      email_enviado: false,
    })
    .select()
    .single()

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  // Filtrar items incluidos y opcionales seleccionados
  const serieItems = itemsJson.filter((i: any) => i.tipo === 'fijo')
  const configItems = itemsJson.filter((i: any) => i.tipo === 'configurable' && i.incluido)
  const ddItems = itemsJson.filter((i: any) => i.tipo === 'dropdown')
  const optItems = itemsJson.filter((i: any) => i.tipo === 'opcional' && !i.incluido)

  function tableRows(items: any[]) {
    return items.map((i: any) => `
      <tr>
        <td style="padding:6px 12px;font-family:monospace;font-size:12px;color:#6b7280;border-bottom:1px solid #f0f0f0">${i.codigo}</td>
        <td style="padding:6px 12px;font-size:13px;border-bottom:1px solid #f0f0f0">${i.descripcion}</td>
        <td style="padding:6px 12px;font-size:13px;text-align:right;border-bottom:1px solid #f0f0f0;white-space:nowrap">${i.precio_lista > 0 && !i.incluido ? '+' + fmt(i.precio_lista) : 'Incluido'}</td>
      </tr>`).join('')
  }

  const quoteNumStr = String(cot.numero).padStart(5, '0')

  const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f4f6fa;margin:0;padding:20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08)">
    <div style="background:#003087;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:18px;font-weight:700">ESCANDINAVIA DEL PLATA S.A.</div>
        <div style="opacity:.8;font-size:13px;margin-top:2px">Volvo Construction Equipment</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;opacity:.7">Cotización</div>
        <div style="font-size:20px;font-weight:700">#${quoteNumStr}</div>
        <div style="font-size:12px;opacity:.7">${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</div>
      </div>
    </div>

    <div style="padding:24px 32px">
      <div style="margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.5px;margin-bottom:4px">Cliente</div>
        <div style="font-size:16px;font-weight:600">${nombreCliente}</div>
        <div style="font-size:13px;color:#6b7280">${emailCliente}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <tr style="background:#f4f6fa">
          <td colspan="2" style="padding:10px 12px;font-weight:700;font-size:14px">${modeloCodigo} — ${modeloNombre}</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:14px">${fmt(precioBase)}</td>
        </tr>
      </table>

      ${serieItems.length ? `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#003087;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8f0fb">Ítems de Serie</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows(serieItems)}</table>` : ''}

      ${configItems.length ? `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#003087;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8f0fb">Configurables Incluidos</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows(configItems)}</table>` : ''}

      ${ddItems.length ? `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#003087;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8f0fb">Opciones Seleccionadas</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows(ddItems)}</table>` : ''}

      ${optItems.length ? `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#003087;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8f0fb">Opcionales Seleccionados</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${tableRows(optItems)}</table>` : ''}

      <div style="background:#003087;color:#fff;padding:16px 20px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-top:20px">
        <span style="font-size:14px">${descuentoPct > 0 ? `TOTAL CON ${descuentoPct}% DESCUENTO` : 'TOTAL CONFIGURADO'}</span>
        <span style="font-size:22px;font-weight:700">${fmt(precioFinal)}</span>
      </div>

      <p style="font-size:11px;color:#9ca3af;margin-top:20px;line-height:1.6">
        Precios en USD. No incluye flete, seguro ni derechos de importación. Validez sujeta a disponibilidad de stock. Cotización generada por Escandinavia del Plata S.A.
      </p>
    </div>
  </div>
</body></html>`

  // Enviar email
  const to = emailVendedor ? [emailCliente, emailVendedor] : [emailCliente]
  const { error: emailErr } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Cotización #${quoteNumStr} — ${modeloCodigo} ${modeloNombre}`,
    html,
  })

  if (!emailErr) {
    await supabase.from('cotizaciones').update({ email_enviado: true }).eq('id', cot.id)
    await supabase.from('actividad').insert({
      usuario_id: userId,
      tipo: 'cotizacion',
      detalle: `Nº ${quoteNumStr} — ${modeloCodigo} — ${fmt(precioFinal)} — Cliente: ${nombreCliente}`,
      metadata: { cotizacion_id: cot.id, numero: cot.numero },
    })
  }

  return NextResponse.json({ success: true, numero: cot.numero, quoteNumStr })
}
