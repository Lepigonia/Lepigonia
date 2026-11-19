import Link from "next/link";
import { T } from "../../../components/SiteChrome";
import { isValidUnsubscribeToken } from "../../../lib/newsletter";

export const metadata = {
  title: "Newsletter abmelden | Lepigonia",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const buttonStyle = { marginTop: "1.5rem", padding: "0.9rem 1.8rem", border: 0, borderRadius: 999, background: "#171715", color: "#fff", font: "inherit", cursor: "pointer" };

export default async function NewsletterUnsubscribePage({ searchParams }) {
  const params = await searchParams;
  const id = typeof params?.id === "string" ? params.id : "";
  const token = typeof params?.t === "string" ? params.t : "";
  const status = typeof params?.status === "string" ? params.status : "";

  let heading;
  let body;
  if (status === "ok") {
    heading = <T en="You're unsubscribed" de="Du bist abgemeldet" />;
    body = <T en="Your email address has been removed from the Lepigonia newsletter list. You will not receive further emails." de="Deine E-Mail-Adresse wurde aus der Lepigonia-Newsletter-Liste entfernt. Du erhältst keine weiteren E-Mails." />;
  } else if (status === "error") {
    heading = <T en="That did not work" de="Das hat nicht geklappt" />;
    body = <T en="The request failed right now. Please open the link from the email again in a moment." de="Die Abmeldung ist gerade fehlgeschlagen. Bitte öffne den Link aus der E-Mail gleich noch einmal." />;
  } else if (status === "invalid" || !id || !token || !isValidUnsubscribeToken(id, token)) {
    heading = <T en="Link not valid" de="Link nicht gültig" />;
    body = <T en="This unsubscribe link is not valid. Please use the link from your latest newsletter email or contact the website operator." de="Dieser Abmeldelink ist nicht gültig. Bitte nutze den Link aus deiner letzten Newsletter-E-Mail oder wende dich an den Betreiber der Website." />;
  } else {
    heading = <T en="Unsubscribe from the newsletter" de="Vom Newsletter abmelden" />;
    body = <>
      <T en="Please confirm that you no longer want to receive the Lepigonia newsletter." de="Bitte bestätige, dass du den Lepigonia-Newsletter nicht mehr erhalten möchtest." />
      <form method="post" action="/api/newsletter/unsubscribe">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="t" value={token} />
        <button type="submit" style={buttonStyle}><T en="Unsubscribe" de="Abmelden" /></button>
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