"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAdminData } from "../lib/admin-data";

export function useAdminData() {
  const [ready, setReady] = useState(null);
  const [posts, setPosts] = useState([]);
  const [countries, setCountries] = useState([]);
  const [about, setAbout] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await loadAdminData();
      setPosts(data.posts);
      setCountries(data.countries);
      setAbout(data.about);
      setReady(true);
      return data;
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
