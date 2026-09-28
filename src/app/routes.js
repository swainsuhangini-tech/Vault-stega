import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";

import LoginPage from "../features/auth/LoginPage";
import RegisterPage from "../features/auth/RegisterPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import ImageHomePage from "../features/image-steganography/ImageHomePage";
import ImageEmbedPage from "../features/image-steganography/ImageEmbedPage";
import ImageExtractPage from "../features/image-steganography/ImageExtractPage";
import AudioHomePage from "../features/audio-steganography/AudioHomePage";
import AudioEmbedPage from "../features/audio-steganography/AudioEmbedPage";
import AudioExtractPage from "../features/audio-steganography/AudioExtractPage";
import EncryptPage from "../features/encryption/EncryptPage";
import DecryptPage from "../features/decryption/DecryptPage";
import ProjectsPage from "../features/projects/ProjectsPage";
import ProjectDetailsPage from "../features/projects/ProjectDetailsPage";
import HistoryPage from "../features/history/HistoryPage";
import VaultPage from "../features/vault/VaultPage";
import StoragePage from "../features/settings/StoragePage";
import SettingsPage from "../features/settings/SettingsPage";
import HelpPage from "../features/help/HelpPage";
import AboutPage from "../features/help/AboutPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/image" element={<ImageHomePage />} />
        <Route path="/image/embed" element={<ImageEmbedPage />} />
        <Route path="/image/extract" element={<ImageExtractPage />} />
        <Route path="/audio" element={<AudioHomePage />} />
        <Route path="/audio/embed" element={<AudioEmbedPage />} />
        <Route path="/audio/extract" element={<AudioExtractPage />} />
        <Route path="/encrypt" element={<EncryptPage />} />
        <Route path="/decrypt" element={<DecryptPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
