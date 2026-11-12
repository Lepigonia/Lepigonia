"use client";

import { useState } from "react";
import AdminContent from "../../components/admin/AdminContent";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAdminController } from "../../hooks/useAdminController";
import { useAdminData } from "../../hooks/useAdminData";
import "./admin.css";

export default function Admin() {
  const data = useAdminData();
  const controller = useAdminController(data);
  const { editor, actions } = controller;
  const [showAnalytics, setShowAnalytics] = useState(false);

  if (data.ready === null) return <div className="admin-loading">Lepigonia Admin …</div>;
  if (!data.ready) return <AdminLogin onSuccess={actions.refresh} />;

  return (
    <main className="admin-shell">
      <AdminHeader onLogout={actions.logout} />
      <div className="admin-grid">
        <AdminSidebar
          posts={data.posts}
          countries={data.countries}
          postSlug={editor.post.slug}
          gallery={editor.gallery}
          section={showAnalytics ? "analytics" : editor.section}
          onNewStory={() => { setShowAnalytics(false); controller.newStory(); }}
          onSelectStory={(post) => { setShowAnalytics(false); controller.selectStory(post); }}
          onNewCountry={() => { setShowAnalytics(false); controller.newCountry(); }}
          onSelectCountry={(country) => { setShowAnalytics(false); controller.selectCountry(country); }}
          onAbout={() => { setShowAnalytics(false); controller.selectAbout(); }}
          onAnalytics={() => setShowAnalytics(true)}
        />
        <AdminContent editor={editor} data={data} actions={actions} controller={controller} showAnalytics={showAnalytics} />
      </div>
    </main>
  );
}
