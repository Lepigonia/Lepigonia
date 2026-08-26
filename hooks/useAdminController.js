"use client";

import { useCallback } from "react";
import { blankPost, useAdminEditorState } from "./useAdminEditorState";
import { useAdminActions } from "./useAdminActions";

export function useAdminController(data) {
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
  const newStory = useCallback(() => {
    clearMessages();
    editor.newStory();
  }, [clearMessages, editor]);

  const selectStory = useCallback((value) => {
    clearMessages();
    editor.selectStory(value);
  }, [clearMessages, editor]);

  const selectCountry = useCallback((country) => {
    clearMessages();
    editor.selectCountry(country);
  }, [clearMessages, editor]);

  const selectAbout = useCallback(() => {
    clearMessages();
    editor.selectAbout();
  }, [clearMessages, editor]);

  const newCountry = useCallback(() => {
    clearMessages();
    editor.newCountry(actions.galleryAction);
  }, [actions.galleryAction, clearMessages, editor]);

  const deletePost = useCallback(() => {
    actions.deletePost(editor.post.slug, blankPost);
  }, [actions.deletePost, editor.post.slug]);

  return {
    editor,
    actions,
    newStory,
    selectStory,
    selectCountry,
    selectAbout,
    newCountry,
    deletePost,
  };
}
