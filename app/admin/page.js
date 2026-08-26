"use client";

import Link from "next/link";
import AdminAboutEditor from "../../components/admin/AdminAboutEditor";
import AdminGalleryEditor from "../../components/admin/AdminGalleryEditor";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminStoryEditor from "../../components/admin/AdminStoryEditor";
import { useAdminController } from "../../hooks/useAdminController";
import { useAdminData } from "../../hooks/useAdminData";
import "./admin.css";

export default function Admin() {
  const data = useAdminData();
  const controller = useAdminController(data);
  const { editor, actions } = controller;

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
          onNewStory={controller.newStory}
          onSelectStory={controller.selectStory}
          onNewCountry={controller.newCountry}
          onSelectCountry={controller.selectCountry}
          onAbout={controller.selectAbout}
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
            onDelete={controller.deletePost}
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
