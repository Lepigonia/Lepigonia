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

  const { newStory: resetStory, selectStory: chooseStory, selectCountry: chooseCountry, selectAbout: chooseAbout } = editor;
  const { galleryAction, deletePost: removePost, clearMessages } = actions;

  const newStory = useCallback(() => {
    clearMessages();
    resetStory();
  }, [clearMessages, resetStory]);

  const selectStory = useCallback((value) => {
    clearMessages();
    chooseStory(value);
  }, [clearMessages, chooseStory]);

  const selectCountry = useCallback((country) => {
    clearMessages();
    chooseCountry(country);
  }, [clearMessages, chooseCountry]);

  const selectAbout = useCallback(() => {
    clearMessages();
    chooseAbout();
  }, [clearMessages, chooseAbout]);

  const newCountry = useCallback(() => {
    clearMessages();
    editor.newCountry(galleryAction);
  }, [clearMessages, editor, galleryAction]);

  const deletePost = useCallback(() => {
    removePost(editor.post.slug, blankPost);
  }, [removePost, editor.post.slug]);

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
