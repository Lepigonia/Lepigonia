"use client";

import { useCallback, useMemo, useState } from "react";

export const blankPost = () => ({
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

export function useAdminEditorState({ setAbout, countries }) {
  const [post, setPost] = useState(blankPost);
  const [section, setSection] = useState("stories");
  const [gallery, setGallery] = useState("");

  const newStory = useCallback(() => {
    setSection("stories");
    setPost(blankPost());
  }, []);

  const selectStory = useCallback((value) => {
    setSection("stories");
    setPost(value);
  }, []);

  const selectCountry = useCallback((country) => {
    setSection("gallery");
    setGallery(country.slug);
    setPost(blankPost());
  }, []);

  const selectAbout = useCallback(() => {
    setSection("about");
    setPost(blankPost());
  }, []);

  const newCountry = useCallback((createCountry) => {
    const name = prompt("Neues Land:");
    if (name) createCountry({ action: "country-create", name });
  }, []);

  const updateAbout = useCallback((language, field, value, index) => {
    setAbout((current) => {
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
  }, [setAbout]);

  const currentCountry = useMemo(
    () => countries.find((country) => country.slug === gallery),
    [countries, gallery]
  );

  return {
    post,
    setPost,
    section,
    setSection,
    gallery,
    setGallery,
    currentCountry,
    newStory,
    selectStory,
    selectCountry,
    selectAbout,
    newCountry,
    updateAbout,
  };
}
