"use client";

import { useState } from "react";

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

export function useAdminEditorState({ about, setAbout, countries, clearMessages }) {
  const [post, setPost] = useState(blankPost);
  const [section, setSection] = useState("stories");
  const [gallery, setGallery] = useState("");

  const reset = () => {
    setPost(blankPost());
    clearMessages();
  };

  const newStory = () => {
    setSection("stories");
    reset();
  };

  const selectStory = (value) => {
    setSection("stories");
    setPost(value);
    clearMessages();
  };

  const selectCountry = (country) => {
    setSection("gallery");
    setGallery(country.slug);
    setPost(blankPost());
    clearMessages();
  };

  const selectAbout = () => {
    setSection("about");
    setPost(blankPost());
    clearMessages();
  };

  const newCountry = (createCountry) => {
    const name = prompt("Neues Land:");
    if (name) createCountry({ action: "country-create", name });
  };

  const updateAbout = (language, field, value, index) => {
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
  };

  return {
    post,
    setPost,
    section,
    setSection,
    gallery,
    setGallery,
    currentCountry: countries.find((country) => country.slug === gallery),
    newStory,
    selectStory,
    selectCountry,
    selectAbout,
    newCountry,
    updateAbout,
    reset,
  };
}
