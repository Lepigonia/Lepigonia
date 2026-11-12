"use client";

import AdminAboutEditor from "./AdminAboutEditor";
import AdminAnalytics from "./AdminAnalytics";
import AdminGalleryEditor from "./AdminGalleryEditor";
import AdminStoryEditor from "./AdminStoryEditor";
import AdminHomepageEditor from "./AdminHomepageEditor";
import AdminNewsletter from "./AdminNewsletter";

export default function AdminContent({ editor, data, actions, controller, showAnalytics, showHomepage, showNewsletter }) {
  if (showAnalytics) return <AdminAnalytics />;
  if (showHomepage) return <AdminHomepageEditor />;
  if (showNewsletter) return <AdminNewsletter />;

  if (editor.section === "about") {
    return (
      <AdminAboutEditor
        about={data.about}
        status={actions.status}
        error={actions.error}
        onChange={editor.updateAbout}
        onSave={(event) => actions.saveAbout(event, data.about)}
      />
    );
  }

  if (editor.section === "stories") {
    return (
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
    );
  }

  if (editor.section === "gallery") {
    return (
      <AdminGalleryEditor
        country={editor.currentCountry}
        files={actions.galleryFiles}
        status={actions.status}
        error={actions.error}
        onFiles={actions.uploadGallery}
        onAction={actions.galleryAction}
      />
    );
  }

  return null;
}
