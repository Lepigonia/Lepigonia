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
  });
  const actions = useAdminActions({
    data,
    gallery: editor.gallery,
    setGallery: editor.setGallery,
    setPost: editor.setPost,
    setSection: editor.setSection,
  });

  const clearMessages = actions.clearMessages;
  const newStory = () => { clearMessages(); editor.newStory(); };
  const selectStory = (value) => { clearMessages(); editor.selectStory(value); };
  const selectCountry = (country) => { clearMessages(); editor.selectCountry(country); };
  const selectAbout = () => { clearMessages(); editor.selectAbout(); };
  const newCountry = () => { clearMessages(); editor.newCountry(actions.galleryAction); };

  if (data.ready === null) return <div className="admin-loading">Lepigonia Admin …</div>;
  if (!data.ready) return <AdminLogin onSuccess={actions.refresh} />;

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
          onNewStory={newStory}
          onSelectStory={selectStory}
          onNewCountry={newCountry}
          onSelectCountry={selectCountry}
          onAbout={selectAbout}
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
            country={editor.currentCountry}
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
