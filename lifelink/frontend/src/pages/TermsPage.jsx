import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Inicio
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-medical-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Términos y Condiciones</h1>
            <p className="text-xs text-gray-400">Última actualización: junio 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300 space-y-6">

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">1. Aceptación de los términos</h2>
            <p className="text-sm leading-relaxed">
              Al acceder o utilizar LifeLink, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar la plataforma. LifeLink se reserva el derecho de modificar estos términos en cualquier momento, notificando los cambios mediante la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">2. Descripción del servicio</h2>
            <p className="text-sm leading-relaxed">
              LifeLink es una plataforma de intermediación para el intercambio, donación y solicitud de insumos médicos entre particulares. LifeLink actúa exclusivamente como intermediario y no es parte de las transacciones entre usuarios. No almacena, envía ni recibe físicamente ningún insumo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">3. Requisitos de uso</h2>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li>Debes tener al menos 18 años para registrarte.</li>
              <li>Debes proporcionar información veraz y actualizada.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
              <li>Un usuario no puede crear múltiples cuentas para evadir restricciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">4. Publicaciones y contenido</h2>
            <p className="text-sm leading-relaxed mb-2">
              Al publicar contenido en LifeLink, declaras ser el legítimo propietario del insumo y que la información proporcionada es veraz. Queda estrictamente prohibido:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1">
              <li>Publicar insumos de origen ilícito o robados.</li>
              <li>Vender sangre humana (prohibido por el Art. 460 de la Ley General de Salud de México).</li>
              <li>Publicar medicamentos controlados sin la prescripción correspondiente.</li>
              <li>Distribuir consumibles médicos usados (RPBI según NOM-087-SEMARNAT).</li>
              <li>Publicar contenido falso, engañoso o fraudulento.</li>
              <li>Utilizar la plataforma para actividades ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">5. Donación de sangre</h2>
            <p className="text-sm leading-relaxed">
              El módulo de donación de sangre opera de conformidad con la NOM-253-SSA1-2012. Los usuarios que se registren como donantes declaran cumplir con los requisitos médicos establecidos (edad, peso, ausencia de enfermedades transmisibles). LifeLink no verifica médicamente estos datos y no se responsabiliza por información incorrecta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">6. Limitación de responsabilidad</h2>
            <p className="text-sm leading-relaxed">
              LifeLink no garantiza la calidad, seguridad, legalidad ni idoneidad de los insumos publicados. Las transacciones se realizan entre particulares bajo su propio riesgo. LifeLink no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso de la plataforma o de las transacciones entre usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">7. Suspensión y cancelación</h2>
            <p className="text-sm leading-relaxed">
              LifeLink puede suspender o cancelar cuentas que violen estos términos, sin previo aviso. Los usuarios pueden cancelar su cuenta en cualquier momento desde su perfil, ejerciendo su derecho de cancelación conforme a la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">8. Legislación aplicable</h2>
            <p className="text-sm leading-relaxed">
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será sometida a la jurisdicción de los tribunales competentes de la Ciudad de México.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">9. Contacto</h2>
            <p className="text-sm leading-relaxed">
              Para cualquier consulta sobre estos términos, puedes contactarnos a través de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
