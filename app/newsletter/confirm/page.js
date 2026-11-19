import Link from "next/link";
import { T } from "../../../components/SiteChrome";

export const metadata = {
  title: "Newsletter bestätigen | Lepigonia",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const buttonStyle = { marginTop: "1.5rem", padding: "0.9rem 1.8rem", border: 0, borderRadius: 999, background: "#171715", color: "#fff", font: "inherit", cursor: "pointer" };

// The e-mail link only opens this page; the subscription is confirmed by the button (POST), so that
// mail scanners that pre-fetch links cannot confirm on someone's behalf.
export default async function NewsletterConfirmPage({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  const status = typeof params?.status === "string" ? params.status : "";

  let heading;
  let body;
  if (status === "ok") {
    heading = <T en="You're subscribed ✨" de="Deine Anmeldung ist bestätigt ✨" />;
    body = <T en="Thank you. Your email address is now confirmed for the Lepigonia newsletter." de="Danke. Deine E-Mail-Adresse ist jetzt für den Lepigonia-Newsletter bestätigt." />;
  } else if (status === "error") {
    heading = <T en="That did not work" de="Das hat nicht geklappt" />;
    body = <T en="The confirmation failed right now. Please open the link from the email again in a moment." de="Die Bestätigung ist gerade fehlgeschlagen. Bitte öffne den Link aus der E-Mail gleich noch einmal." />;
  } else if (status === "invalid" || !token) {
    heading = <T en="Link not valid" de="Link nicht gültig" />;
    body = <T en="This confirmation link is invalid or has expired (links are valid for 48 hours). Please sign up again." de="Dieser Bestätigungslink ist ungültig oder abgelaufen (Links gelten 48 Stunden). Bitte melde dich erneut an." />;
  } else {
    heading = <T en="Confirm your subscription" de="Anmeldung bestätigen" />;
    body = <>
      <T en="One last step: please confirm that you want to receive the Lepigonia newsletter." de="Ein letzter Schritt: Bitte bestätige, dass du den Lepigonia-Newsletter erhalten möchtest." />
      <form method="post" action="/api/newsletter/confirm">
        <input type="hidden" name="token" value={token} />
        <button type="submit" style={buttonStyle}><T en="Confirm subscription" de="Anmeldung bestätigen" /></button>
      </form>
    </>;
  }

  return (
    <main className="page-top section-wrap">
      <p className="eyebrow">Newsletter</p>
      <h1 className="page-title">{heading}</h1>
      <div className="page-lead">{body}</div>
      <p style={{ marginTop: "2rem" }}><Link href="/"><T en="Back to Lepigonia" de="Zurück zu Lepigonia" /></Link></p>
    </main>
  );
}