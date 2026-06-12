import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_BASE_STYLE = """
  font-family:'Plus Jakarta Sans',Arial,sans-serif;
  max-width:600px;margin:0 auto;background:#f8fafc;
  border-radius:16px;overflow:hidden;
"""
_HEADER = """
  <div style="background:linear-gradient(135deg,#0770a8,#14b8a6);
              padding:30px 36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:-0.5px;">
      Life<span style="color:#b2f5ea;">Link</span> Medical
    </h1>
    <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:13px;">
      Plataforma solidaria de insumos médicos en México
    </p>
  </div>
"""


def _send_smtp(to: str, subject: str, html: str, settings) -> bool:
    """Envío SMTP síncrono — se ejecuta en un thread separado."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to, msg.as_string())
    return True


async def send_email(to: str, subject: str, html: str) -> bool:
    """
    Envía un correo usando SMTP (Gmail) o Resend como respaldo.
    Devuelve True si se envió, False si no hay configuración disponible.
    """
    from app.config import get_settings
    settings = get_settings()

    # Intentar SMTP primero
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            await asyncio.to_thread(_send_smtp, to, subject, html, settings)
            logger.info(f"EMAIL SMTP OK: enviado a {to}")
            return True
        except Exception as e:
            logger.error(f"EMAIL SMTP ERROR enviando a {to}: {e}")
            raise

    # Respaldo: Resend
    if settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": settings.FROM_EMAIL or f"LifeLink <onboarding@resend.dev>",
                "to": [to],
                "subject": subject,
                "html": html,
            })
            logger.info(f"EMAIL RESEND OK: enviado a {to}")
            return True
        except Exception as e:
            logger.error(f"EMAIL RESEND ERROR enviando a {to}: {e}")
            raise

    logger.warning("EMAIL SKIP: no hay SMTP_USER ni RESEND_API_KEY configurados")
    return False


async def send_verification_email(to_email: str, username: str, token: str) -> None:
    from app.config import get_settings
    settings = get_settings()
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    html = f"""
    <div style="{_BASE_STYLE}">
      {_HEADER}
      <div style="padding:32px 36px;background:#fff;">
        <h2 style="color:#0c5d8a;margin:0 0 12px;">Hola, {username} 👋</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
          Gracias por unirte a LifeLink Medical. Para activar tu cuenta verifica tu correo:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="{link}"
             style="background:linear-gradient(135deg,#0770a8,#14b8a6);
                    color:#fff;padding:14px 36px;border-radius:12px;
                    text-decoration:none;font-weight:700;font-size:15px;
                    display:inline-block;">
            Verificar mi correo
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
          Este enlace expira en <strong>24 horas</strong>.
          Si no creaste esta cuenta, ignora este mensaje.<br>
          <a href="{link}" style="color:#0770a8;word-break:break-all;">{link}</a>
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 LifeLink Medical · México</p>
      </div>
    </div>
    """
    await send_email(to_email, "Verifica tu correo — LifeLink Medical", html)


async def send_otp_email(to_email: str, username: str, otp: str) -> bool:
    html = f"""
    <div style="{_BASE_STYLE}">
      {_HEADER}
      <div style="padding:32px 36px;background:#fff;">
        <h2 style="color:#0c5d8a;margin:0 0 12px;">Tu código de verificación</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
          Hola <strong>{username}</strong>, usa este código para completar tu inicio de sesión:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;background:#f0f9ff;border:2px solid #0770a8;
                      border-radius:16px;padding:20px 40px;">
            <span style="font-size:36px;font-weight:900;letter-spacing:12px;
                         color:#0770a8;font-family:monospace;">{otp}</span>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;text-align:center;">
          Expira en <strong>10 minutos</strong>. Si no intentaste iniciar sesión, cambia tu contraseña.
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 LifeLink Medical · México</p>
      </div>
    </div>
    """
    return await send_email(to_email, f"Tu código LifeLink: {otp}", html)


async def send_reset_password_email(to_email: str, username: str, token: str) -> None:
    from app.config import get_settings
    settings = get_settings()
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html = f"""
    <div style="{_BASE_STYLE}">
      {_HEADER}
      <div style="padding:32px 36px;background:#fff;">
        <h2 style="color:#0c5d8a;margin:0 0 12px;">Restablecer contraseña</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
          Hola <strong>{username}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón para crear una nueva:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="{link}"
             style="background:linear-gradient(135deg,#0770a8,#14b8a6);
                    color:#fff;padding:14px 36px;border-radius:12px;
                    text-decoration:none;font-weight:700;font-size:15px;
                    display:inline-block;">
            Crear nueva contraseña
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
          Este enlace expira en <strong>1 hora</strong>.
          Si no solicitaste este cambio, ignora este mensaje — tu contraseña no cambiará.<br>
          <a href="{link}" style="color:#0770a8;word-break:break-all;">{link}</a>
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 LifeLink Medical · México</p>
      </div>
    </div>
    """
    await send_email(to_email, "Restablece tu contraseña — LifeLink Medical", html)


async def send_2fa_enabled_email(to_email: str, username: str) -> None:
    html = f"""
    <div style="{_BASE_STYLE}">
      {_HEADER}
      <div style="padding:32px 36px;background:#fff;">
        <h2 style="color:#0c5d8a;margin:0 0 12px;">Autenticación en dos pasos activada</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
          Hola <strong>{username}</strong>, el 2FA está ahora <strong>activado</strong> en tu cuenta.
        </p>
        <p style="color:#dc2626;font-size:13px;background:#fef2f2;
                  padding:12px 16px;border-radius:8px;border-left:3px solid #dc2626;">
          Si no fuiste tú, desactiva el 2FA desde tu perfil o contacta soporte.
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 LifeLink Medical · México</p>
      </div>
    </div>
    """
    await send_email(to_email, "2FA activado — LifeLink Medical", html)
