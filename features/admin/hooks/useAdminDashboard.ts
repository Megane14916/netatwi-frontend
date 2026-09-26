"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  addNews,
  createContest,
  deleteContest,
  deleteNews,
  getAdminNews,
  getManagedContests,
  updateContest,
} from "@/lib/api/endpoints/admin";
import type { AdminCreateContestPayload, AdminManagedContest } from "@/types/api";
import type { NewsItem } from "@/types/domain";
import {
  buildCreateContestPayload,
  buildUpdateContestPayload,
  clearCreatedContestFields,
  createInitialContestForm,
  updateContestFormField,
} from "../model/contestForm";

export type AdminTab = "create" | "manage" | "news";

export function useAdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("create");
  const [newsToDelete, setNewsToDelete] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<AdminCreateContestPayload>(createInitialContestForm);
  const [createStatus, setCreateStatus] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [managedContests, setManagedContests] = useState<AdminManagedContest[]>([]);
  const [manageLoading, setManageLoading] = useState(true);
  const [manageError, setManageError] = useState<string | null>(null);
  const [showPasswordId, setShowPasswordId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<AdminManagedContest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingContest, setEditingContest] = useState<AdminManagedContest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newNewsUrl, setNewNewsUrl] = useState("");
  const [isAddingNews, setIsAddingNews] = useState(false);

  useEffect(() => {
    if (activeTab === "manage") {
      setManageLoading(true);
      setManageError(null);
      getManagedContests()
        .then(setManagedContests)
        .catch((error) =>
          setManageError(error instanceof Error ? error.message : "不明なエラーが発生しました。"),
        )
        .finally(() => setManageLoading(false));
    } else if (activeTab === "news") {
      setNewsLoading(true);
      setNewsError(null);
      getAdminNews()
        .then(setNewsList)
        .catch((error) =>
          setNewsError(error instanceof Error ? error.message : "不明なエラーが発生しました。"),
        )
        .finally(() => setNewsLoading(false));
    }
  }, [activeTab]);

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateStatus("loading");
    setCreateMessage("作成中...");
    try {
      const contestId = await createContest(buildCreateContestPayload(createForm));
      setCreateStatus("success");
      setCreateMessage(`大会「${createForm.name}」が作成されました！ (ID: ${contestId})`);
      setCreateForm(clearCreatedContestFields);
    } catch (error) {
      setCreateStatus("error");
      setCreateMessage(error instanceof Error ? error.message : "大会の作成に失敗しました。");
    }
  };

  const handleCreateFormChange = <K extends keyof AdminCreateContestPayload>(
    field: K,
    value: AdminCreateContestPayload[K],
  ) => setCreateForm((current) => updateContestFormField(current, field, value));

  const handleDeleteContest = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    try {
      await deleteContest(showDeleteModal.id);
      setManagedContests((current) => current.filter((contest) => contest.id !== showDeleteModal.id));
      setShowDeleteModal(null);
    } catch (error) {
      toast({ title: "エラー", description: `削除エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingContest) return;
    setIsUpdating(true);
    try {
      await updateContest(editingContest.id, buildUpdateContestPayload(editingContest));
      setManagedContests((current) =>
        current.map((contest) =>
          contest.id === editingContest.id ? { ...contest, ...editingContest } : contest,
        ),
      );
      setEditingContest(null);
    } catch (error) {
      toast({ title: "エラー", description: `更新エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNews = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAddingNews(true);
    try {
      await addNews(newNewsUrl);
      setNewNewsUrl("");
      setNewsList(await getAdminNews());
    } catch (error) {
      toast({ title: "エラー", description: `追加エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
    } finally {
      setIsAddingNews(false);
    }
  };

  const confirmDeleteNews = async () => {
    if (newsToDelete === null) return;
    const id = newsToDelete;
    setNewsToDelete(null);
    try {
      await deleteNews(id);
      setNewsList((current) => current.filter((news) => news.id !== id));
    } catch (error) {
      toast({ title: "エラー", description: `削除エラー: ${error instanceof Error ? error.message : error}`, variant: "destructive" });
    }
  };

  return {
    activeTab,
    setActiveTab,
    newsToDelete,
    setNewsToDelete,
    createForm,
    createStatus,
    createMessage,
    handleCreateSubmit,
    handleCreateFormChange,
    managedContests,
    manageLoading,
    manageError,
    showPasswordId,
    setShowPasswordId,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleDeleteContest,
    editingContest,
    setEditingContest,
    isUpdating,
    handleEditSubmit,
    newsList,
    newsLoading,
    newsError,
    newNewsUrl,
    setNewNewsUrl,
    isAddingNews,
    handleAddNews,
    confirmDeleteNews,
  };
}

export type AdminDashboardController = ReturnType<typeof useAdminDashboard>;
