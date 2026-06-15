import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Inicio
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-medical-600 rounded-xl flex items-center justify-center shadow-sm">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Aviso de Privacidad</h1>
            <p className="text-xs text-gray-400">Última actualización: junio 2026 · Conforme a LFPDPPP</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 space-y-6">

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">1. Responsable del tratamiento</h2>
            <p className="text-sm leading-relaxed">
              LifeLink es el responsable del tratamiento de sus datos personales. Estamos comprometidos con la protección de su privacidad de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">2. Datos personales que recabamos</h2>
            <p className="text-sm leading-relaxed mb-2">Recabamos los siguientes datos personales:</p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li><strong>Identificación:</strong> nombre completo, correo electrónico, nombre de usuario.</li>
              <li><strong>Contacto:</strong> teléfono, ciudad, estado.</li>
              <li><strong>Datos sensibles (con consentimiento explícito):</strong> tipo de sangre, historial médico relevante para donación de sangre (peso, condiciones médicas, cirugías recientes).</li>
              <li><strong>Actividad en la plataforma:</strong> publicaciones, solicitudes, mensajes, reseñas.</li>
              <li><strong>Técnicos:</strong> dirección IP, tipo de dispositivo (para seguridad y mejora del servicio).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">3. Datos sensibles</h2>
            <p className="text-sm leading-relaxed">
              El expediente médico de donación de sangre contiene datos sensibles conforme al Art. 3, fracción VI de la LFPDPPP. Su tratamiento requiere consentimiento explícito, el cual se recaba mediante el checkbox de aceptación al momento de crear el expediente. Estos datos se utilizan exclusivamente para determinar elegibilidad como donante y no se comparten con terceros sin su consentimiento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">4. Finalidades del tratamiento</h2>
            <p className="text-sm leading-relaxed mb-2"><strong>Finalidades primarias (necesarias para el servicio):</strong></p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 mb-3">
              <li>Creación y gestión de su cuenta de usuario.</li>
              <li>Publicación y búsqueda de insumos médicos.</li>
              <li>Facilitación de contacto entre usuarios para transacciones.</li>
              <li>Sistema de mensajería y notificaciones.</li>
              <li>Verificación de elegibilidad para donación de sangre.</li>
            </ul>
            <p className="text-sm leading-relaxed mb-2"><strong>Finalidades secundarias (puede oponerse):</strong></p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li>Envío de notificaciones sobre funciones nuevas de la plataforma.</li>
              <li>Estadísticas agregadas y anónimas para mejora del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">5. Transferencia de datos</h2>
            <p className="text-sm leading-relaxed">
              LifeLink no vende, alquila ni cede sus datos personales a terceros con fines comerciales. Sus datos pueden ser compartidos únicamente con: (a) proveedores de servicios tecnológicos necesarios para operar la plataforma (almacenamiento en nube, CDN de imágenes), bajo acuerdos de confidencialidad; (b) autoridades competentes cuando sea requerido por ley.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">6. Derechos ARCO</h2>
            <p className="text-sm leading-relaxed mb-2">
              Conforme a la LFPDPPP, usted tiene los siguientes derechos sobre sus datos personales:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li><strong>Acceso:</strong> puede descargar todos sus datos desde Perfil → "Exportar mis datos".</li>
              <li><strong>Rectificación:</strong> puede actualizar su información en cualquier momento desde su perfil.</li>
              <li><strong>Cancelación:</strong> puede eliminar su cuenta desde Perfil → "Eliminar mi cuenta". Su perfil será anonimizado.</li>
              <li><strong>Oposición:</strong> puede oponerse a finalidades secundarias contactándonos directamente.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              Respondemos solicitudes ARCO en un plazo máximo de 20 días hábiles conforme a lo establecido en la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">7. Seguridad</h2>
            <p className="text-sm leading-relaxed">
              Implementamos medidas técnicas y organizativas para proteger sus datos: cifrado de contraseñas con bcrypt, tokens JWT con expiración y transmisiones cifradas mediante HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">8. Retención de datos</h2>
            <p className="text-sm leading-relaxed">
              Sus datos se conservan mientras su cuenta esté activa. Al eliminar su cuenta, los datos de identificación personal son anonimizados de inmediato. Los registros de transacciones pueden conservarse por el período requerido por obligaciones legales (máximo 5 años conforme a legislación fiscal y comercial mexicana).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">9. Cookies</h2>
            <p className="text-sm leading-relaxed">
              LifeLink utiliza almacenamiento local (localStorage) del navegador para mantener su sesión autenticada. No utilizamos cookies de rastreo de terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">10. Cambios al aviso</h2>
            <p className="text-sm leading-relaxed">
              Cualquier cambio relevante a este aviso de privacidad será notificado mediante la plataforma con al menos 30 días de anticipación. La versión vigente siempre estará disponible en esta página.
            </p>
          </section>

        </div>

        <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 text-center">
          <p className="text-xs text-primary-700 dark:text-primary-400 font-medium">
            Este aviso cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y la NOM-253-SSA1-2012 para el módulo de donación de sangre.
          </p>
        </div>
      </div>
    </div>
  );
}
