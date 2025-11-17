import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Hacer Resend opcional - solo inicializar si hay API key
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend Email configurado');
} else {
  console.log('⚠️  Resend Email no configurado (RESEND_API_KEY no encontrada)');
}

// Enviar presupuesto por email
export const enviarPresupuestoPorEmail = async (presupuesto, emailDestino) => {

  if (!resend) {
    console.log('⚠️  Email no enviado (Resend no configurado):', { to, subject });
    return { success: false, message: 'Servicio de email no configurado' };
  }

  try {
    const htmlPresupuesto = generarHTMLPresupuesto(presupuesto);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: emailDestino,
      subject: `Presupuesto ${presupuesto.numero} - ${presupuesto.cliente_nombre}`,
      html: htmlPresupuesto,
    });

    if (error) {
      console.error('Error de Resend:', error);
      throw new Error(error.message || 'Error al enviar email');
    }

    //console.log('✅ Email enviado:', data.id);
    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

// Generar HTML del presupuesto
const generarHTMLPresupuesto = (presupuesto) => {
  const detalleHTML = presupuesto.detalle.map(item => {
    const subtotalItem = item.cantidad * item.precio_unitario;
    const descuentoItem = subtotalItem * (item.descuento_porcentaje / 100);
    const totalItem = subtotalItem - descuentoItem;

    return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">${item.producto_codigo}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${item.descripcion}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px;">${item.cantidad}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px;">${presupuesto.moneda_simbolo} ${parseFloat(item.precio_unitario).toFixed(2)}</td>
        ${item.descuento_porcentaje > 0 ? `<td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #dc2626;">${item.descuento_porcentaje}%</td>` : '<td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #9ca3af;">-</td>'}
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 14px;">${presupuesto.moneda_simbolo} ${totalItem.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="650" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">DS-Corralón</h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Presupuesto ${presupuesto.numero}</p>
                </td>
              </tr>

<!-- Info Grid -->
              <tr>
                <td style="padding: 30px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <!-- Cliente -->
                      <td width="55%" style="padding: 24px; vertical-align: top; border-right: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 14px 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">📋 Para</p>
                        <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #1f2937; line-height: 1.3;">${presupuesto.cliente_nombre}</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                          ${presupuesto.cliente_cuit ? `
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #6b7280; width: 80px;">CUIT/DNI:</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: 500;">${presupuesto.cliente_cuit}</td>
                          </tr>
                          ` : ''}
                          ${presupuesto.cliente_direccion ? `
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #6b7280; width: 80px; vertical-align: top;">Dirección:</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: 500;">${presupuesto.cliente_direccion}</td>
                          </tr>
                          ` : ''}
                          ${presupuesto.cliente_telefono ? `
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #6b7280; width: 80px;">Teléfono:</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; font-weight: 500;">${presupuesto.cliente_telefono}</td>
                          </tr>
                          ` : ''}
                          ${presupuesto.cliente_email ? `
                          <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #6b7280; width: 80px;">Email:</td>
                            <td style="padding: 6px 0; font-size: 13px; color: #2563eb; font-weight: 500;">${presupuesto.cliente_email}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                      
                      <!-- Datos del Presupuesto -->
                      <td width="45%" style="padding: 24px; vertical-align: top; background-color: #f9fafb;">
                        <p style="margin: 0 0 14px 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">📅 Datos del Presupuesto</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; font-size: 13px; color: #6b7280;">Número:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 700; text-align: right;">${presupuesto.numero}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">Fecha:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${new Date(presupuesto.fecha).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                          </tr>
                          ${presupuesto.fecha_vencimiento ? `
                          <tr>
                            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">Válido hasta:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #dc2626; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">${new Date(presupuesto.fecha_vencimiento).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">Moneda:</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; border-top: 1px solid #e5e7eb;">${presupuesto.moneda_codigo} (${presupuesto.moneda_simbolo})</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Productos -->
              <tr>
                <td style="padding: 10px 40px 30px 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Detalle de Productos</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Código</th>
                        <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Producto</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Cant.</th>
                        <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">P. Unit.</th>
                        <th style="padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Desc.</th>
                        <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${detalleHTML}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Totales -->
              <tr>
                <td style="padding: 0 40px 30px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="60%"></td>
                      <td width="40%">
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Subtotal:</td>
                              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${presupuesto.moneda_simbolo} ${parseFloat(presupuesto.subtotal).toFixed(2)}</td>
                            </tr>
                            ${presupuesto.descuento_monto > 0 ? `
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb;">Descuento ${presupuesto.descuento_porcentaje > 0 ? '(' + presupuesto.descuento_porcentaje + '%)' : ''}:</td>
                              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #dc2626; text-align: right; border-top: 1px solid #e5e7eb;">- ${presupuesto.moneda_simbolo} ${parseFloat(presupuesto.descuento_monto).toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #1f2937; border-top: 2px solid #1f2937;">TOTAL:</td>
                              <td style="padding: 12px 0 0 0; font-size: 22px; font-weight: 700; color: #10b981; text-align: right; border-top: 2px solid #1f2937;">${presupuesto.moneda_simbolo} ${parseFloat(presupuesto.total).toFixed(2)}</td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Observaciones -->
              ${presupuesto.observaciones ? `
              <tr>
                <td style="padding: 0 40px 30px 40px;">
                  <div style="background-color: #fffbeb; padding: 16px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Observaciones</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5; white-space: pre-wrap;">${presupuesto.observaciones}</p>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Footer -->
              <tr>
                <td style="padding: 25px 40px; background-color: #f9fafb; text-align: center; border-top: 2px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">¡Gracias por su preferencia!</p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">Este presupuesto fue generado automáticamente por DS-Corralón</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export default { enviarPresupuestoPorEmail };