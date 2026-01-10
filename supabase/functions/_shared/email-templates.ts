/**
 * Email template utilities for Zero Waste Frankfurt
 *
 * Provides HTML and text email templates for:
 * - Admin notifications when new submissions arrive
 * - Approval emails to submitters
 * - Rejection emails to submitters
 */

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
  .footer { margin-top: 40px; font-size: 12px; color: #666; }
  h2 { color: #10B981; }
  .label { font-weight: 600; color: #666; }
`

/**
 * Generate admin notification email when a new submission arrives
 */
export function getAdminNotificationTemplate(
  locationName: string,
  submitterEmail: string,
  submittedAt: string,
  adminPanelUrl: string
): EmailTemplate {
  const formattedDate = new Date(submittedAt).toLocaleString('de-DE', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h2>Neue Standort-Einreichung</h2>
    <p>Es wurde eine neue Standort-Einreichung verifiziert und wartet auf Ihre Genehmigung.</p>

    <div class="info-box">
      <p><span class="label">Standort:</span> <strong>${locationName}</strong></p>
      <p><span class="label">Eingereicht von:</span> ${submitterEmail}</p>
      <p><span class="label">Zeitstempel:</span> ${formattedDate}</p>
    </div>

    <p>Bitte überprüfen Sie die Einreichung im Admin-Panel:</p>
    <a href="${adminPanelUrl}" class="button">Zum Admin-Panel</a>

    <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
    <p><a href="${adminPanelUrl}">${adminPanelUrl}</a></p>

    <div class="footer">
      <p>Zero Waste Frankfurt Admin System<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Neue Standort-Einreichung

Es wurde eine neue Standort-Einreichung verifiziert und wartet auf Ihre Genehmigung.

Standort: ${locationName}
Eingereicht von: ${submitterEmail}
Zeitstempel: ${formattedDate}

Bitte überprüfen Sie die Einreichung im Admin-Panel:
${adminPanelUrl}

--
Zero Waste Frankfurt Admin System
https://zerowastefrankfurt.de
  `

  return {
    subject: `Neue Einreichung: ${locationName}`,
    html,
    text,
  }
}

/**
 * Generate approval email for submitter when location is approved
 */
export function getApprovalEmailTemplate(
  locationName: string,
  locale: 'de' | 'en' = 'de'
): EmailTemplate {
  if (locale === 'en') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h2>Your Submission Was Approved!</h2>
    <p>Great news! Your submission for <strong>${locationName}</strong> has been reviewed and approved by our team.</p>

    <p>The location is now visible on the Zero Waste Frankfurt map and can help others discover sustainable options in Frankfurt.</p>

    <a href="https://map.zerowastefrankfurt.de" class="button">View on Map</a>

    <p>Thank you for contributing to a more sustainable Frankfurt!</p>

    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Your Submission Was Approved!

Great news! Your submission for "${locationName}" has been reviewed and approved by our team.

The location is now visible on the Zero Waste Frankfurt map and can help others discover sustainable options in Frankfurt.

View on map: https://map.zerowastefrankfurt.de

Thank you for contributing to a more sustainable Frankfurt!

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
    `

    return {
      subject: `Approved: ${locationName}`,
      html,
      text,
    }
  }

  // German version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h2>Ihre Einreichung wurde genehmigt!</h2>
    <p>Gute Nachrichten! Ihre Einreichung für <strong>${locationName}</strong> wurde von unserem Team geprüft und genehmigt.</p>

    <p>Der Standort ist jetzt auf der Zero Waste Frankfurt Karte sichtbar und kann anderen helfen, nachhaltige Optionen in Frankfurt zu entdecken.</p>

    <a href="https://map.zerowastefrankfurt.de" class="button">Auf Karte ansehen</a>

    <p>Vielen Dank für Ihren Beitrag zu einem nachhaltigeren Frankfurt!</p>

    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Ihre Einreichung wurde genehmigt!

Gute Nachrichten! Ihre Einreichung für "${locationName}" wurde von unserem Team geprüft und genehmigt.

Der Standort ist jetzt auf der Zero Waste Frankfurt Karte sichtbar und kann anderen helfen, nachhaltige Optionen in Frankfurt zu entdecken.

Auf Karte ansehen: https://map.zerowastefrankfurt.de

Vielen Dank für Ihren Beitrag zu einem nachhaltigeren Frankfurt!

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
  `

  return {
    subject: `Genehmigt: ${locationName}`,
    html,
    text,
  }
}

/**
 * Generate rejection email for submitter when location is rejected
 */
export function getRejectionEmailTemplate(
  locationName: string,
  reason: string,
  locale: 'de' | 'en' = 'de'
): EmailTemplate {
  if (locale === 'en') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h2>Update on Your Submission</h2>
    <p>Thank you for your submission of <strong>${locationName}</strong> to Zero Waste Frankfurt.</p>

    <p>After careful review, we are unable to approve this submission at this time for the following reason:</p>

    <div class="info-box">
      <p>${reason}</p>
    </div>

    <p>If you believe this decision was made in error or if you have updated information, please feel free to submit again.</p>

    <a href="https://map.zerowastefrankfurt.de" class="button">Submit Again</a>

    <p>Thank you for your understanding and for supporting sustainable initiatives in Frankfurt!</p>

    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Update on Your Submission

Thank you for your submission of "${locationName}" to Zero Waste Frankfurt.

After careful review, we are unable to approve this submission at this time for the following reason:

${reason}

If you believe this decision was made in error or if you have updated information, please feel free to submit again.

Submit again: https://map.zerowastefrankfurt.de

Thank you for your understanding and for supporting sustainable initiatives in Frankfurt!

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
    `

    return {
      subject: `Update on Your Submission: ${locationName}`,
      html,
      text,
    }
  }

  // German version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h2>Update zu Ihrer Einreichung</h2>
    <p>Vielen Dank für Ihre Einreichung von <strong>${locationName}</strong> bei Zero Waste Frankfurt.</p>

    <p>Nach sorgfältiger Prüfung können wir diese Einreichung derzeit aus folgendem Grund nicht genehmigen:</p>

    <div class="info-box">
      <p>${reason}</p>
    </div>

    <p>Wenn Sie glauben, dass diese Entscheidung irrtümlich getroffen wurde, oder wenn Sie aktualisierte Informationen haben, können Sie gerne erneut einreichen.</p>

    <a href="https://map.zerowastefrankfurt.de" class="button">Erneut einreichen</a>

    <p>Vielen Dank für Ihr Verständnis und für die Unterstützung nachhaltiger Initiativen in Frankfurt!</p>

    <div class="footer">
      <p>Zero Waste Frankfurt<br>
      <a href="https://zerowastefrankfurt.de">zerowastefrankfurt.de</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Update zu Ihrer Einreichung

Vielen Dank für Ihre Einreichung von "${locationName}" bei Zero Waste Frankfurt.

Nach sorgfältiger Prüfung können wir diese Einreichung derzeit aus folgendem Grund nicht genehmigen:

${reason}

Wenn Sie glauben, dass diese Entscheidung irrtümlich getroffen wurde, oder wenn Sie aktualisierte Informationen haben, können Sie gerne erneut einreichen.

Erneut einreichen: https://map.zerowastefrankfurt.de

Vielen Dank für Ihr Verständnis und für die Unterstützung nachhaltiger Initiativen in Frankfurt!

--
Zero Waste Frankfurt
https://zerowastefrankfurt.de
  `

  return {
    subject: `Update zu Ihrer Einreichung: ${locationName}`,
    html,
    text,
  }
}
