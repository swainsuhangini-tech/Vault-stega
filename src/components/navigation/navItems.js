import {
  LayoutDashboard,
  ImageIcon,
  AudioLines,
  Lock,
  Unlock,
  FolderKanban,
  History,
  ShieldCheck,
  HardDrive,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/image", label: "Image Steganography", icon: ImageIcon },
  { to: "/audio", label: "Audio Steganography", icon: AudioLines },
  { to: "/encrypt", label: "Encrypt", icon: Lock },
  { to: "/decrypt", label: "Decrypt", icon: Unlock },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/history", label: "History", icon: History },
  { to: "/vault", label: "Vault", icon: ShieldCheck },
  { to: "/storage", label: "Storage", icon: HardDrive },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
  { to: "/about", label: "About", icon: Info },
];
