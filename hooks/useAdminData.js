"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../lib/admin-api";

export function useAdminData() {
  const [ready, setReady] = useState(null);
  const [posts, setPosts] = useState([]);
  const [countries, setCountries] = useState([]);
  const [about, setAbout] = useState(null);

  const load = useCallback(async () => {
    try {
      const [postData, galleryData, aboutData] = await Promise.all([
        adminApi.posts(),
        adminApi.gallery(),
        adminApi.about(),
      ]);
      setPosts(postData.posts || []);
      setCountries(galleryData.countries || []);
      setAbout(aboutData);
      setReady(true);
      return {
        posts: postData.posts || [],
        countries: galleryData.countries || [],
        about: aboutData,
      };
    } catch (err) {
      if (err.status === 401 || err.status === 403) setReady(false);
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ready,
    posts,
    countries,
    about,
    setAbout,
    reload: load,
  };
}
