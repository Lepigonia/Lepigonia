"use client";

import Link from "next/link";
import { useState } from "react";
import AdminAboutEditor from "../../components/admin/AdminAboutEditor";
import AdminGalleryEditor from "../../components/admin/AdminGalleryEditor";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminStoryEditor from "../../components/admin/AdminStoryEditor";
import { useAdminActions } from "../../hooks/useAdminActions";
import { useAdminData } from "../../hooks/useAdminData";
import "./admin.css";

const blankPost = () => ({
  slug: "",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  country: "",
  lat: "",
  lng: "",
  image: "",
  excerpt: "",
  content: "",
});

export default function Admin() {
  const data = useAdminData();
  const [post, setPost] = useState(blankPost);
  const [section, setSection] = useState("stories");
  const [gallery, setGallery] = useState("");
  const actions = useAdminActions({ data, gallery, setGallery, setPost, setSection });
  const currentCountry = data.countries.find((country) => country.slug === gallery);

  function updateAbout(language, field, value, index) {
    data.setAbout((current) => {
      const localized = { ...(current[language] || {}) };
      if (field === "paragraphs") {
        const paragraphs = [...(localized.paragraphs || ["", "", ""])];
        paragraphs[index] = value;
        localized.paragraphs = paragraphs;
      } else {
        localized[field] = value;
      }
      return { ...current, [language]: localized };
    });
  }

  if (data.ready === null) return <div className="admin-loading">Lepigonia Admin …</div>;
  if (!data.ready) return <AdminLogin onSuccess={actions.refresh} />;

  function newStory() {
    setSection("stories");
    setPost(blankPost());
    actions.clearMessages();
  }

  function selectStory(value) {
    setSection("stories");
    setPost(value);
    actions.clearMessages();
  }

  function selectCountry(country) {
    setSection("gallery");
    setGallery(country.slug);
    setPost(blankPost());
    actions.clearMessages();
  }

  function newCountry() {
    const name = prompt("Neues Land:");
    if (name) actions.galleryAction({ action: "country-create", name });
  }

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div><Link href="/" className="admin-brand">Lepigonia</Link><span className="admin-top-label"> / Admin</span></div>
        <nav className="admin-top-nav"><button onClick={actions.logout}>Logout</button></nav>
      </header>
      <div className="admin-grid">
        <AdminSidebar
          posts={data.posts}
          countries={data.countries}
          postSlug={post.slug}
          gallery={gallery}
          section={section}
          onNewStory={newStory}
          onSelectStory={selectStory}
          onNewCountry={newCountry}
          onSelectCountry={selectCountry}
          onAbout={() => { setSection("about"); setPost(blankPost()); actions.clearMessages(); }}
        />
        {section === "about" && (
          <AdminAboutEditor about={data.about} status={actions.status} error={actions.error} onChange={updateAbout} onSave={(event) => actions.saveAbout(event, data.about)} />
        )}
        {section === "stories" && (
          <AdminStoryEditor post={post} countries={data.countries} status={actions.status} error={actions.error} onChange={setPost} onSave={(event) => actions.savePost(event, post)} onDelete={() => actions.deletePost(post.slug, blankPost)} onHeroUpload={actions.uploadHero} />
        )}
        {section === "gallery" && (
          <AdminGalleryEditor country={currentCountry} files={actions.galleryFiles} status={actions.status} error={actions.error} onFiles={actions.uploadGallery} onAction={actions.galleryAction} />
        )}
      </div>
    </main>
  );
}
