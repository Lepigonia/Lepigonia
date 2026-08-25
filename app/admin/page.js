"use client";

import Link from "next/link";
import AdminAboutEditor from "../../components/admin/AdminAboutEditor";
import AdminGalleryEditor from "../../components/admin/AdminGalleryEditor";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminStoryEditor from "../../components/admin/AdminStoryEditor";
import { useAdminActions } from "../../hooks/useAdminActions";
import { blankPost, useAdminEditorState } from "../../hooks/useAdminEditorState";
import { useAdminData } from "../../hooks/useAdminData";
import "./admin.css";

export default function Admin() {
  const data = useAdminData();
  const editor = useAdminEditorState({
    setAbout: data.setAbout,
    countries: data.countries,
    clearMessages: () => actions.clearMessages(),
  });
  const actions = useAdminActions({
    data,
    gallery: editor.gallery,
    setGallery: editor.setGallery,
    setPost: editor.setPost,
    setSection: editor.setSection,
  });
  const currentCountry = data.countries.find((country) => country.slug === editor.gallery);

  if (data.ready === null) return <div className="admin-loading">Lepigonia Admin …</div>;
  if (!data.ready) return <AdminLogin onSuccess={actions.refresh} />;

  const createCountry = (body) => actions.galleryAction(body);

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
          postSlug={editor.post.slug}
          gallery={editor.gallery}
          section={editor.section}
          onNewStory={editor.newStory}
          onSelectStory={editor.selectStory}
          onNewCountry={() => editor.newCountry(createCountry)}
          onSelectCountry={editor.selectCountry}
          onAbout={editor.selectAbout}
        />
        {editor.section === "about" && (
          <AdminAboutEditor
            about={data.about}
            status={actions.status}
            error={actions.error}
            onChange={editor.updateAbout}
            onSave={(event) => actions.saveAbout(event, data.about)}
          />
        )}
        {editor.section === "stories" && (
          <AdminStoryEditor
            post={editor.post}
            countries={data.countries}
            status={actions.status}
            error={actions.error}
            onChange={editor.setPost}
            onSave={(event) => actions.savePost(event, editor.post)}
            onDelete={() => actions.deletePost(editor.post.slug, blankPost)}
            onHeroUpload={actions.uploadHero}
          />
        )}
        {editor.section === "gallery" && (
          <AdminGalleryEditor
            country={currentCountry}
            files={actions.galleryFiles}
            status={actions.status}
            error={actions.error}
            onFiles={actions.uploadGallery}
            onAction={actions.galleryAction}
          />
        )}
      </div>
    </main>
  );
}
