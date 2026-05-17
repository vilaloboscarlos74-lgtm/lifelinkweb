import logging
import resend

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


async def send_email(to: str, subject: str, html: str) -> None:
    from app.config import get_settings
    settings = get_settings()

    if not settings.RESEND_API_KEY:
        logger.warning("EMAIL SKIP: RESEND_API_KEY no configurada")
        return

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"EMAIL OK: enviado a {to}")
    except Exception as e:
        logger.error(f"EMAIL ERROR: {e}")


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
          Gracias por unirte a LifeLink Medical. Para activar tu cuenta y
          empezar a donar o solicitar insumos médicos, verifica tu correo:
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="{link}"
             style="background:linear-gradient(135deg,#0770a8,#14b8a6);
                    color:#fff;padding:14px 36px;border-radius:12px;
                    text-decoration:none;font-weight:700;font-size:15px;
                    display:inline-block;letter-spacing:0.2px;">
            Verificar mi correo
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
          Este enlace expira en <strong>24 horas</strong>.
          Si no creaste esta cuenta, ignora este mensaje.<br>
          ¿No funciona el botón? Copia este enlace:<br>
          <a href="{link}" style="color:#0770a8;word-break:break-all;">{link}</a>
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">
          © 2026 LifeLink Medical · México
        </p>
      </div>
    </div>
    """
    await send_email(to_email, "Verifica tu correo — LifeLink Medical", html)


async def send_2fa_enabled_email(to_email: str, username: str) -> None:
    html = f"""
    <div style="{_BASE_STYLE}">
      {_HEADER}
      <div style="padding:32px 36px;background:#fff;">
        <h2 style="color:#0c5d8a;margin:0 0 12px;">
          Autenticación en dos pasos activada
        </h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
          Hola <strong>{username}</strong>, la verificación en dos pasos
          está ahora <strong>activada</strong> en tu cuenta de LifeLink Medical.
        </p>
        <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
          A partir de ahora necesitarás tu aplicación autenticadora
          (Google Authenticator, Authy) cada vez que inicies sesión.
        </p>
        <p style="color:#dc2626;font-size:13px;background:#fef2f2;
                  padding:12px 16px;border-radius:8px;border-left:3px solid #dc2626;">
          Si no fuiste tú, desactiva el 2FA desde tu perfil
          o contacta soporte inmediatamente.
        </p>
      </div>
      <div style="padding:16px;text-align:center;background:#f1f5f9;">
        <p style="color:#94a3b8;font-size:11px;margin:0;">
          © 2026 LifeLink Medical · México
        </p>
      </div>
    </div>
    """
    await send_email(to_email, "2FA activado — LifeLink Medical", html)
