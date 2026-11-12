import Link from "next/link";
import { T } from "../../components/SiteChrome";

export const metadata = {
  title: "Datenschutz | Lepigonia",
  description: "Informationen zur Verarbeitung von Daten bei Lepigonia und zur Newsletter-Anmeldung.",
};

export default function PrivacyPage() {
  return (
    <main className="page-top section-wrap">
      <p className="eyebrow"><T en="Privacy" de="Datenschutz" /></p>
      <h1 className="page-title"><T en={<>Your data. Your choice.</>} de={<>Deine Daten. Deine Entscheidung.</>} /></h1>
      <p className="page-lead"><T en="This page explains what information is collected when you use the Lepigonia newsletter form." de="Hier erfährst du, welche Daten bei einer Anmeldung zum Lepigonia-Newsletter verarbeitet werden." /></p>
      <div className="prose privacy-copy">
        <h2><T en="Newsletter registration" de="Newsletter-Anmeldung" /></h2>
        <p><T en="If you sign up, we store your email address, the date and time of your consent, the consent text version and whether you joined via the pop-up or the newsletter link. We use these details only to manage the newsletter list and, once a mailing service is connected, to send the travel updates you requested." de="Wenn du dich anmeldest, speichern wir deine E-Mail-Adresse, Datum und Uhrzeit deiner Einwilligung, die Version des Einwilligungstextes und ob du dich über das Pop-up oder den Newsletter-Link angemeldet hast. Diese Angaben dienen ausschließlich der Verwaltung der Newsletter-Liste und – sobald ein Versanddienst angebunden ist – dem Versand der gewünschten Reise-Updates." /></p>
        <h2><T en="No newsletter is sent yet" de="Derzeit noch kein Newsletter-Versand" /></h2>
        <p><T en="The current website stores registrations in its database. No newsletter emails are sent at this time. Your address is not displayed publicly and the list can only be accessed by the site administrator." de="Die Website speichert Anmeldungen derzeit in ihrer Datenbank. Aktuell werden noch keine Newsletter-E-Mails verschickt. Deine Adresse wird nicht öffentlich angezeigt; auf die Liste kann nur der Administrator der Website zugreifen." /></p>
        <h2><T en="Storage and deletion" de="Speicherung und Löschung" /></h2>
        <p><T en="Your registration remains stored until you withdraw your consent or request deletion. You can request deletion by contacting the website operator. The administrator can also remove an entry from the protected admin area." de="Deine Anmeldung bleibt gespeichert, bis du deine Einwilligung widerrufst oder die Löschung verlangst. Du kannst die Löschung beim Betreiber der Website anfragen. Der Administrator kann einen Eintrag außerdem im geschützten Admin-Bereich entfernen." /></p>
        <h2><T en="Your rights and contact" de="Deine Rechte und Kontakt" /></h2>
        <p><T en="You may withdraw your consent at any time and request access, correction or deletion of your data. The website operator's identity and contact details must be provided in the site's legal notice before newsletter registrations are used for sending." de="Du kannst deine Einwilligung jederzeit widerrufen und Auskunft, Berichtigung oder Löschung deiner Daten verlangen. Die Identität und Kontaktdaten des Website-Betreibers müssen vor einem späteren Newsletter-Versand im Impressum und in den vollständigen Datenschutzhinweisen ergänzt sein." /></p>
        <p><Link href="/"><T en="Back to Lepigonia" de="Zurück zu Lepigonia" /></Link></p>
      </div>
    </main>
  );
}
