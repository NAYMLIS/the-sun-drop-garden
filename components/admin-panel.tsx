"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  MapPin,
  Music,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { GenericLink } from "@/components/media-embed";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { detectLinkType, normalizeUrl } from "@/lib/media-utils";
import type { AttractionCategory, TourDate } from "@/lib/types";

interface AdminPanelProps {
  dates: TourDate[];
}

interface CityResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

const ATTRACTION_CATEGORIES: AttractionCategory[] = [
  "environmental",
  "vendors",
  "venues",
  "services",
  "education",
  "art",
  "wellness",
  "miscellaneous",
  "accommodation",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const exportToCSV = (
  data: unknown[],
  filename: string,
  headers: string[],
  getRow: (item: unknown) => string[]
) => {
  const csvContent = [
    headers.join(","),
    ...data.map((item) => {
      const row = getRow(item);
      return row
        .map((cell) => {
          const cellStr = String(cell ?? "");
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createExportSubscriptionsHandler = (
  emailSubscriptions: unknown[],
  addToast: (message: string, variant?: "default" | "destructive") => void
) => {
  return () => {
    const date = new Date().toISOString().split("T")[0];
    exportToCSV(
      emailSubscriptions,
      `email-subscriptions-${date}.csv`,
      ["Name", "Email", "Subscribed Date"],
      (item) => {
        const sub = item as {
          name: string;
          email: string;
          subscribedAt: number;
        };
        return [
          sub.name,
          sub.email,
          new Date(sub.subscribedAt).toLocaleString(),
        ];
      }
    );
    addToast("Email subscriptions exported");
  };
};

const createExportInquiriesHandler = (
  inquiries: unknown[],
  addToast: (message: string, variant?: "default" | "destructive") => void
) => {
  return () => {
    const date = new Date().toISOString().split("T")[0];
    exportToCSV(
      inquiries,
      `inquiries-${date}.csv`,
      ["Name", "Email", "Inquiry Types", "Message", "Submitted Date"],
      (item) => {
        const inquiry = item as {
          name?: string;
          email?: string;
          inquiryTypes: string[];
          message?: string;
          submittedAt: number;
        };
        return [
          inquiry.name || "",
          inquiry.email || "",
          inquiry.inquiryTypes.join("; "),
          inquiry.message || "",
          new Date(inquiry.submittedAt).toLocaleString(),
        ];
      }
    );
    addToast("Inquiries exported");
  };
};

const createExportLeadsHandler = (
  emailSubscriptions: unknown[],
  inquiries: unknown[],
  websiteInquiries: unknown[],
  addToast: (message: string, variant?: "default" | "destructive") => void
) => {
  return () => {
    const date = new Date().toISOString().split("T")[0];
    const allLeads: Array<{
      type: string;
      name: string;
      email: string;
      inquiryTypes?: string[];
      message?: string;
      submittedAt: number;
    }> = [
      ...emailSubscriptions.map((sub) => ({
        type: "Email Subscription",
        name: (sub as { name: string }).name,
        email: (sub as { email: string }).email,
        submittedAt: (sub as { subscribedAt: number }).subscribedAt,
      })),
      ...inquiries.map((inq) => ({
        type: "Inquiry",
        name: (inq as { name?: string }).name || "",
        email: (inq as { email?: string }).email || "",
        inquiryTypes: (inq as { inquiryTypes: string[] }).inquiryTypes,
        message: (inq as { message?: string }).message,
        submittedAt: (inq as { submittedAt: number }).submittedAt,
      })),
      ...websiteInquiries.map((inq) => ({
        type: "Website Inquiry",
        name: (inq as { name: string }).name,
        email: (inq as { email: string }).email,
        message: (inq as { message?: string }).message,
        submittedAt: (inq as { submittedAt: number }).submittedAt,
      })),
    ].sort((a, b) => b.submittedAt - a.submittedAt);

    exportToCSV(
      allLeads,
      `leads-${date}.csv`,
      ["Type", "Name", "Email", "Inquiry Types", "Message", "Submitted Date"],
      (item) => {
        const lead = item as {
          type: string;
          name: string;
          email: string;
          inquiryTypes?: string[];
          message?: string;
          submittedAt: number;
        };
        return [
          lead.type,
          lead.name || "",
          lead.email || "",
          lead.inquiryTypes?.join("; ") || "",
          lead.message || "",
          new Date(lead.submittedAt).toLocaleString(),
        ];
      }
    );
    addToast("Leads exported");
  };
};

const createCitySearchHandler = (
  setCity: (value: string) => void,
  searchTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  setSearchResults: (results: CityResult[]) => void,
  setShowResults: (show: boolean) => void,
  setIsSearching: (searching: boolean) => void
) => {
  return (query: string) => {
    setCity(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("City search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };
};

const createAttractionSearchHandler = (
  setAttractionName: (value: string) => void,
  attractionSearchTimeout: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
  setAttractionSearchResults: (results: CityResult[]) => void,
  setShowAttractionResults: (show: boolean) => void,
  setIsAttractionSearching: (searching: boolean) => void
) => {
  return (query: string) => {
    setAttractionName(query);

    if (attractionSearchTimeout.current) {
      clearTimeout(attractionSearchTimeout.current);
    }
    if (query.length < 3) {
      setAttractionSearchResults([]);
      setShowAttractionResults(false);
      return;
    }

    setIsAttractionSearching(true);
    attractionSearchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setAttractionSearchResults(data);
        setShowAttractionResults(true);
      } catch (error) {
        console.error("Attraction search failed:", error);
      } finally {
        setIsAttractionSearching(false);
      }
    }, 500);
  };
};

const createDeleteHandler = <T,>(
  itemToDelete: T | null,
  deleteFn: () => Promise<void>,
  cleanupFn: () => void,
  successFn: () => void,
  errorFn: () => void
) => {
  return async () => {
    if (!itemToDelete) {
      return;
    }
    try {
      await deleteFn();
      cleanupFn();
      successFn();
    } catch (error) {
      console.error("Delete failed:", error);
      errorFn();
    }
  };
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Admin panel requires handling multiple forms, dialogs, and data management
export const AdminPanel: React.FC<AdminPanelProps> = ({ dates }) => {
  const [activeTab, setActiveTab] = useState<"thread" | "tour" | "connect">(
    "thread"
  );

  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [lat, setLat] = useState("0");
  const [lng, setLng] = useState("0");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Attraction form state
  const [attractionName, setAttractionName] = useState("");
  const [attractionAddress, setAttractionAddress] = useState("");
  const [attractionLat, setAttractionLat] = useState("0");
  const [attractionLng, setAttractionLng] = useState("0");
  const [attractionCategory, setAttractionCategory] =
    useState<AttractionCategory>("environmental");
  const [attractionCity, setAttractionCity] = useState("");
  const [attractionDescription, setAttractionDescription] = useState("");
  const [attractionSearchResults, setAttractionSearchResults] = useState<
    CityResult[]
  >([]);
  const [isAttractionSearching, setIsAttractionSearching] = useState(false);
  const [showAttractionResults, setShowAttractionResults] = useState(false);
  const attractionSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Search State
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Post form state
  const [postCaption, setPostCaption] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postFilePreview, setPostFilePreview] = useState<string | null>(null);
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
  } | null>(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    id: string;
    caption?: string;
  } | null>(null);
  const [showPostDeleteDialog, setShowPostDeleteDialog] = useState(false);

  const addTourDate = useMutation(api.tourDates.add);
  const updateTourDate = useMutation(api.tourDates.update);
  const removeTourDate = useMutation(api.tourDates.remove);
  const addAttraction = useMutation(api.attractions.add);
  const removeAttraction = useMutation(api.attractions.remove);
  const removeEmailSubscription = useMutation(
    api.forms.removeEmailSubscription
  );
  const removeInquiry = useMutation(api.forms.removeInquiry);
  const removeWebsiteInquiry = useMutation(api.forms.removeWebsiteInquiry);
  const attractions = useQuery(api.attractions.list) || [];
  const emailSubscriptions = useQuery(api.forms.listEmailSubscriptions) || [];
  const inquiries = useQuery(api.forms.listInquiries) || [];
  const websiteInquiries = useQuery(api.forms.listWebsiteInquiries) || [];
  const posts = useQuery(api.posts.list) || [];
  const addPost = useMutation(api.posts.add);
  const removePost = useMutation(api.posts.remove);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const { addToast } = useToast();

  // Email forwarding state (stored in localStorage)
  const [forwardEmails, setForwardEmails] = useState<string[]>([]);
  const [newForwardEmail, setNewForwardEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("forwardEmails");
    if (stored) {
      try {
        setForwardEmails(JSON.parse(stored));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Cleanup file preview URL on unmount
  useEffect(() => {
    return () => {
      if (postFilePreview) {
        URL.revokeObjectURL(postFilePreview);
      }
    };
  }, [postFilePreview]);

  // Fetch link preview when URL changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!postLinkUrl || postLinkUrl.trim().length < 3) {
        setLinkPreview(null);
        return;
      }

      const normalized = normalizeUrl(postLinkUrl);
      setIsFetchingPreview(true);

      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(normalized)}`
        );
        if (response.ok) {
          const data = await response.json();
          setLinkPreview(data);
        } else {
          setLinkPreview(null);
        }
      } catch (error) {
        console.error("Failed to fetch link preview:", error);
        setLinkPreview(null);
      } finally {
        setIsFetchingPreview(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [postLinkUrl]);

  const addForwardEmail = () => {
    const email = newForwardEmail.trim();
    if (!email) {
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      addToast("Please enter a valid email address", "destructive");
      return;
    }

    if (forwardEmails.includes(email)) {
      addToast("Email already added", "destructive");
      return;
    }

    const updated = [...forwardEmails, email];
    setForwardEmails(updated);
    localStorage.setItem("forwardEmails", JSON.stringify(updated));
    setNewForwardEmail("");
    addToast("Email added successfully");
  };

  const removeForwardEmail = (email: string) => {
    const updated = forwardEmails.filter((e) => e !== email);
    setForwardEmails(updated);
    localStorage.setItem("forwardEmails", JSON.stringify(updated));
    addToast("Email removed");
  };

  const handleExportSubscriptions = createExportSubscriptionsHandler(
    emailSubscriptions,
    addToast
  );

  const handleExportInquiries = createExportInquiriesHandler(
    inquiries,
    addToast
  );

  const handleExportLeads = createExportLeadsHandler(
    emailSubscriptions,
    inquiries,
    websiteInquiries,
    addToast
  );

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attractionToDelete, setAttractionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showTourDateDeleteDialog, setShowTourDateDeleteDialog] =
    useState(false);
  const [tourDateToDelete, setTourDateToDelete] = useState<{
    id: string;
    city: string;
    venue: string;
  } | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressDialogData, setAddressDialogData] = useState<{
    id: string;
    city: string;
    currentAddress?: string;
    currentTicketLink?: string;
    currentTime?: string;
  } | null>(null);
  const [newAddressValue, setNewAddressValue] = useState("");
  const [newTicketLinkValue, setNewTicketLinkValue] = useState("");
  const [newTimeValue, setNewTimeValue] = useState("");
  const [currentTourDateIndex, setCurrentTourDateIndex] = useState<number>(0);
  const [
    showEmailSubscriptionDeleteDialog,
    setShowEmailSubscriptionDeleteDialog,
  ] = useState(false);
  const [emailSubscriptionToDelete, setEmailSubscriptionToDelete] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [showInquiryDeleteDialog, setShowInquiryDeleteDialog] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<{
    id: string;
    name?: string;
    email?: string;
  } | null>(null);
  const [showWebsiteInquiryDeleteDialog, setShowWebsiteInquiryDeleteDialog] =
    useState(false);
  const [websiteInquiryToDelete, setWebsiteInquiryToDelete] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const handleCitySearch = createCitySearchHandler(
    setCity,
    searchTimeout,
    setSearchResults,
    setShowResults,
    setIsSearching
  );

  const selectCity = (result: CityResult) => {
    // Try to extract a clean city name
    const cityName =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.display_name.split(",")[0];
    setCity(cityName);
    setLat(Number.parseFloat(result.lat).toFixed(4));
    setLng(Number.parseFloat(result.lon).toFixed(4));
    setSearchResults([]);
    setShowResults(false);
  };

  const handleGenerate = async () => {
    if (!(city && venue)) {
      return;
    }
    setIsGenerating(true);

    // Clear previous values to show we are working
    setDescription("Consulting the stars...");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, venue }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate");
      }

      const info = await response.json();

      if (info) {
        setDescription(info.description);
        // Only override lat/lng if they are still 0 or user hasn't used search
        if (lat === "0" && lng === "0") {
          setLat(info.lat.toString());
          setLng(info.lng.toString());
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setDescription("The stars are silent. Please enter details manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAttractionSearch = createAttractionSearchHandler(
    setAttractionName,
    attractionSearchTimeout,
    setAttractionSearchResults,
    setShowAttractionResults,
    setIsAttractionSearching
  );

  const selectAttractionLocation = (result: CityResult) => {
    setAttractionName(
      result.display_name.split(",").slice(0, 2).join(", ") ||
        result.display_name
    );
    setAttractionLat(Number.parseFloat(result.lat).toFixed(4));
    setAttractionLng(Number.parseFloat(result.lon).toFixed(4));
    setAttractionSearchResults([]);
    setShowAttractionResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addTourDate({
        city,
        venue,
        date,
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
        ticketLink: "#",
        description: description || undefined,
        address: address || undefined,
        time: time || undefined,
      });

      // Reset
      setCity("");
      setVenue("");
      setDate("");
      setTime("");
      setLat("0");
      setLng("0");
      setAddress("");
      setDescription("");
    } catch (error) {
      console.error("Failed to add tour date:", error);
    }
  };

  const handleAttractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!attractionCity) {
      addToast("Please select a city from the tour dates", "destructive");
      return;
    }

    try {
      await addAttraction({
        name: attractionName,
        address: attractionAddress || undefined,
        lat: Number.parseFloat(attractionLat),
        lng: Number.parseFloat(attractionLng),
        category: attractionCategory,
        city: attractionCity,
        description: attractionDescription || undefined,
      });

      // Reset
      setAttractionName("");
      setAttractionAddress("");
      setAttractionLat("0");
      setAttractionLng("0");
      setAttractionCategory("environmental");
      setAttractionCity("");
      setAttractionDescription("");
    } catch (error) {
      console.error("Failed to add attraction:", error);
    }
  };

  const handleAddressSubmit = async () => {
    if (!addressDialogData) {
      return;
    }
    try {
      await updateTourDate({
        id: addressDialogData.id as Id<"tourDates">,
        address: newAddressValue.trim() || undefined,
        ticketLink: newTicketLinkValue.trim() || undefined,
        time: newTimeValue.trim() || undefined,
      });
      setShowAddressDialog(false);
      setAddressDialogData(null);
      setNewAddressValue("");
      setNewTicketLinkValue("");
      setNewTimeValue("");
      addToast("Tour date updated successfully");
    } catch (error) {
      console.error("Failed to update tour date:", error);
      addToast("Failed to update tour date", "destructive");
    }
  };

  const handleDeleteConfirm = createDeleteHandler(
    attractionToDelete,
    async () => {
      if (!attractionToDelete) {
        return;
      }
      await removeAttraction({
        id: attractionToDelete.id as Id<"attractions">,
      });
    },
    () => {
      setShowDeleteDialog(false);
      setAttractionToDelete(null);
    },
    () => addToast("Attraction deleted successfully"),
    () => addToast("Failed to delete attraction", "destructive")
  );

  const handleTourDateDeleteConfirm = createDeleteHandler(
    tourDateToDelete,
    async () => {
      if (!tourDateToDelete) {
        return;
      }
      await removeTourDate({ id: tourDateToDelete.id as Id<"tourDates"> });
    },
    () => {
      setShowTourDateDeleteDialog(false);
      setTourDateToDelete(null);
      setShowAddressDialog(false);
      setAddressDialogData(null);
    },
    () => addToast("Tour date deleted successfully"),
    () => addToast("Failed to delete tour date", "destructive")
  );

  const handleEmailSubscriptionDeleteConfirm = createDeleteHandler(
    emailSubscriptionToDelete,
    async () => {
      if (!emailSubscriptionToDelete) {
        return;
      }
      await removeEmailSubscription({
        id: emailSubscriptionToDelete.id as Id<"emailSubscriptions">,
      });
    },
    () => {
      setShowEmailSubscriptionDeleteDialog(false);
      setEmailSubscriptionToDelete(null);
    },
    () => addToast("Email subscription deleted successfully"),
    () => addToast("Failed to delete email subscription", "destructive")
  );

  const handleInquiryDeleteConfirm = createDeleteHandler(
    inquiryToDelete,
    async () => {
      if (!inquiryToDelete) {
        return;
      }
      await removeInquiry({ id: inquiryToDelete.id as Id<"inquiries"> });
    },
    () => {
      setShowInquiryDeleteDialog(false);
      setInquiryToDelete(null);
    },
    () => addToast("Inquiry deleted successfully"),
    () => addToast("Failed to delete inquiry", "destructive")
  );

  const handleWebsiteInquiryDeleteConfirm = createDeleteHandler(
    websiteInquiryToDelete,
    async () => {
      if (!websiteInquiryToDelete) {
        return;
      }
      await removeWebsiteInquiry({
        id: websiteInquiryToDelete.id as Id<"websiteInquiries">,
      });
    },
    () => {
      setShowWebsiteInquiryDeleteDialog(false);
      setWebsiteInquiryToDelete(null);
    },
    () => addToast("Website inquiry deleted successfully"),
    () => addToast("Failed to delete website inquiry", "destructive")
  );

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form submission requires handling multiple media types and validation
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(postCaption || postFile || postLinkUrl)) {
      addToast("Please add a caption, file, or link", "destructive");
      return;
    }

    setIsUploading(true);

    try {
      let fileId: Id<"_storage"> | undefined;
      let mediaType: "image" | "audio" | "video" | "link" | null = null;
      let linkType:
        | "youtube"
        | "soundcloud"
        | "bandcamp"
        | "vimeo"
        | "spotify"
        | "generic"
        | undefined;

      if (postFile) {
        // Upload file to Convex
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": postFile.type },
          body: postFile,
        });
        const response = await result.json();
        // Convex returns { storageId: "..." }
        fileId = response.storageId as string as Id<"_storage">;

        // Determine media type from file
        if (postFile.type.startsWith("image/")) {
          mediaType = "image";
        } else if (postFile.type.startsWith("audio/")) {
          mediaType = "audio";
        } else if (postFile.type.startsWith("video/")) {
          mediaType = "video";
        }

        // Create post with uploaded file
        await addPost({
          caption: postCaption || undefined,
          mediaType,
          fileId,
          fileUrl: undefined,
          linkUrl: undefined,
          linkType: undefined,
        });
      } else if (postLinkUrl) {
        mediaType = "link";
        const normalizedUrl = normalizeUrl(postLinkUrl);
        linkType = detectLinkType(normalizedUrl);
        // Store the normalized URL with preview metadata
        await addPost({
          caption: postCaption || undefined,
          mediaType,
          fileId,
          fileUrl: undefined,
          linkUrl: normalizedUrl,
          linkType,
          linkTitle: linkPreview?.title,
          linkDescription: linkPreview?.description,
          linkImage: linkPreview?.image,
          linkFavicon: linkPreview?.favicon,
        });
      } else {
        // Text-only post
        await addPost({
          caption: postCaption || undefined,
          mediaType: null,
          fileId,
          fileUrl: undefined,
          linkUrl: undefined,
          linkType: undefined,
        });
      }

      // Reset form
      setPostCaption("");
      setPostFile(null);
      if (postFilePreview) {
        URL.revokeObjectURL(postFilePreview);
      }
      setPostFilePreview(null);
      setPostLinkUrl("");
      // Reset file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
      addToast("Post created successfully");
    } catch (error) {
      console.error("Failed to create post:", error);
      addToast("Failed to create post", "destructive");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostDeleteConfirm = createDeleteHandler(
    postToDelete,
    async () => {
      if (!postToDelete) {
        return;
      }
      await removePost({ id: postToDelete.id as Id<"posts"> });
    },
    () => {
      setShowPostDeleteDialog(false);
      setPostToDelete(null);
    },
    () => addToast("Post deleted successfully"),
    () => addToast("Failed to delete post", "destructive")
  );

  const navigateToTourDate = (index: number) => {
    if (index < 0 || index >= dates.length) {
      return;
    }
    const d = dates[index];
    setCurrentTourDateIndex(index);
    setAddressDialogData({
      id: d._id,
      city: d.city,
      currentAddress: d.address,
      currentTicketLink: d.ticketLink,
      currentTime: d.time,
    });
    setNewAddressValue(d.address || "");
    setNewTicketLinkValue(d.ticketLink || "");
    setNewTimeValue(d.time || "");
  };

  const handlePrevTourDate = () => {
    if (currentTourDateIndex > 0) {
      navigateToTourDate(currentTourDateIndex - 1);
    }
  };

  const handleNextTourDate = () => {
    if (currentTourDateIndex < dates.length - 1) {
      navigateToTourDate(currentTourDateIndex + 1);
    }
  };

  return (
    <div className="mx-auto mt-12 mb-24 max-w-2xl rounded-xl border border-primary/30 bg-card/10 p-8 backdrop-blur-md">
      <h2 className="mb-8 text-center font-serif text-3xl text-foreground">
        Admin
      </h2>

      {/* Tab Navigation */}
      <div className="mb-8 flex gap-4 border-primary/20 border-b">
        <button
          className={`pb-4 font-serif text-lg transition-colors ${
            activeTab === "thread"
              ? "border-foreground border-b-2 text-foreground"
              : "text-foreground/50 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("thread")}
          type="button"
        >
          Thread
        </button>
        <button
          className={`pb-4 font-serif text-lg transition-colors ${
            activeTab === "tour"
              ? "border-foreground border-b-2 text-foreground"
              : "text-foreground/50 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("tour")}
          type="button"
        >
          Tour
        </button>
        <button
          className={`pb-4 font-serif text-lg transition-colors ${
            activeTab === "connect"
              ? "border-foreground border-b-2 text-foreground"
              : "text-foreground/50 hover:text-foreground"
          }`}
          onClick={() => setActiveTab("connect")}
          type="button"
        >
          Connect
        </button>
      </div>

      {/* Thread Tab Content */}
      {activeTab === "thread" && (
        <>
          <form className="relative" onSubmit={handlePostSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-foreground/70 text-xs tracking-wider">
                  Words
                </FieldLabel>
                <Textarea
                  className="min-h-[100px] w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={3}
                  value={postCaption}
                />
              </Field>

              <Field>
                <FieldLabel className="text-foreground/70 text-xs tracking-wider">
                  Media
                </FieldLabel>
                <Input
                  accept="image/*,audio/*,video/*"
                  className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPostFile(file);

                    // Create preview URL
                    if (postFilePreview) {
                      URL.revokeObjectURL(postFilePreview);
                    }

                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setPostFilePreview(previewUrl);
                    } else {
                      setPostFilePreview(null);
                    }
                  }}
                  type="file"
                />
                {postFilePreview && postFile && (
                  <div className="mt-4">
                    {postFile.type.startsWith("image/") && (
                      <div className="relative w-full overflow-hidden rounded-lg border border-primary/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {/* biome-ignore lint/performance/noImgElement: File preview, dimensions unknown */}
                        {/* biome-ignore lint/correctness/useImageSize: Preview image dimensions unknown */}
                        <img
                          alt="Preview"
                          className="h-auto w-full object-cover"
                          src={postFilePreview}
                        />
                      </div>
                    )}
                    {postFile.type.startsWith("audio/") && (
                      <div className="w-full rounded-lg border border-primary/20 bg-foreground/5 p-4">
                        <p className="mb-2 text-foreground/70 text-sm">
                          {postFile.name}
                        </p>
                        {/* biome-ignore lint/a11y/useMediaCaption: File preview, captions would need to be provided separately */}
                        <audio
                          className="w-full"
                          controls
                          src={postFilePreview}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    {postFile.type.startsWith("video/") && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-primary/20">
                        {/* biome-ignore lint/a11y/useMediaCaption: File preview, captions would need to be provided separately */}
                        <video
                          className="h-full w-full object-cover"
                          controls
                          src={postFilePreview}
                        >
                          Your browser does not support the video element.
                        </video>
                      </div>
                    )}
                  </div>
                )}
                {postFile && !postFilePreview && (
                  <p className="mt-2 text-foreground/60 text-xs">
                    Selected: {postFile.name}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel className="text-foreground/70 text-xs tracking-wider">
                  Link
                </FieldLabel>
                <Input
                  className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                  onChange={(e) => setPostLinkUrl(e.target.value)}
                  placeholder="youtube.com/watch?v=... or thecloud.so/daniel, etc. (https:// optional)"
                  type="text"
                  value={postLinkUrl}
                />
                {isFetchingPreview && (
                  <p className="mt-2 text-foreground/60 text-xs">
                    Fetching preview...
                  </p>
                )}
                {postLinkUrl && !isFetchingPreview && (
                  <p className="mt-2 text-foreground/60 text-xs">
                    Detected: {detectLinkType(normalizeUrl(postLinkUrl))}
                  </p>
                )}
                {linkPreview && postLinkUrl && (
                  <div className="mt-4">
                    <GenericLink
                      description={linkPreview.description}
                      favicon={linkPreview.favicon}
                      image={linkPreview.image}
                      title={linkPreview.title}
                      url={normalizeUrl(postLinkUrl)}
                    />
                  </div>
                )}
              </Field>

              <Button
                className="mt-4 w-full rounded bg-primary py-3 font-serif text-background text-xl transition-colors hover:bg-foreground disabled:opacity-50"
                disabled={
                  isUploading || !(postCaption || postFile || postLinkUrl)
                }
                type="submit"
              >
                {isUploading ? "Creating..." : "Create Post"}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-12">
            <h3 className="mb-4 font-serif text-foreground text-xl">Posts</h3>
            {posts.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">No posts yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => {
                  const getMediaIcon = () => {
                    switch (post.mediaType) {
                      case "image":
                        return (
                          <ImageIcon className="text-foreground/60" size={16} />
                        );
                      case "video":
                        return (
                          <Video className="text-foreground/60" size={16} />
                        );
                      case "audio":
                        return (
                          <Music className="text-foreground/60" size={16} />
                        );
                      case "link":
                        return (
                          <LinkIcon className="text-foreground/60" size={16} />
                        );
                      default:
                        return null;
                    }
                  };

                  const getMediaThumbnail = () => {
                    if (post.mediaType === "image" && post.fileUrl) {
                      return (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-primary/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {/* biome-ignore lint/performance/noImgElement: Post thumbnail, dimensions unknown */}
                          {/* biome-ignore lint/correctness/useImageSize: Thumbnail dimensions unknown */}
                          <img
                            alt="Post thumbnail"
                            className="h-full w-full object-cover"
                            src={post.fileUrl}
                          />
                        </div>
                      );
                    }
                    if (post.mediaType === "link" && post.linkImage) {
                      return (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-primary/20 bg-foreground/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {/* biome-ignore lint/performance/noImgElement: Link preview image, dimensions unknown */}
                          {/* biome-ignore lint/correctness/useImageSize: Link image dimensions unknown */}
                          <img
                            alt="Link preview"
                            className="h-full w-full object-contain"
                            src={post.linkImage}
                          />
                        </div>
                      );
                    }
                    if (post.mediaType === "link" && post.linkFavicon) {
                      return (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border border-primary/20 bg-foreground/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {/* biome-ignore lint/performance/noImgElement: Favicon, dimensions unknown */}
                          {/* biome-ignore lint/correctness/useImageSize: Favicon dimensions unknown */}
                          <img
                            alt="Favicon"
                            className="h-8 w-8"
                            src={post.linkFavicon}
                          />
                        </div>
                      );
                    }
                    return null;
                  };

                  return (
                    <li
                      className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                      key={post._id}
                    >
                      <div className="flex items-start gap-3">
                        {getMediaThumbnail()}
                        <div className="flex flex-1 items-start justify-between">
                          <div className="flex-1">
                            {post.caption && (
                              <p className="mb-2 text-foreground text-sm">
                                {post.caption}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="text-foreground/50 text-xs">
                                {new Date(post.createdAt).toLocaleString()}
                              </div>
                              {post.mediaType && (
                                <div className="flex items-center gap-1">
                                  {getMediaIcon()}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                            onClick={() => {
                              setPostToDelete({
                                id: post._id,
                                caption: post.caption,
                              });
                              setShowPostDeleteDialog(true);
                            }}
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <AlertDialog
            onOpenChange={setShowPostDeleteDialog}
            open={showPostDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this post
                  {postToDelete?.caption
                    ? `: "${postToDelete.caption.substring(0, 50)}${postToDelete.caption.length > 50 ? "..." : ""}"`
                    : ""}
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePostDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Tour Tab Content */}
      {activeTab === "tour" && (
        <>
          <form className="relative" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      City Search
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        autoComplete="off"
                        className="w-full rounded border border-primary/20 bg-background/50 p-3 pl-10 text-foreground outline-none transition-colors focus:border-primary"
                        onChange={(e) => handleCitySearch(e.target.value)}
                        onFocus={() => city.length >= 3 && setShowResults(true)}
                        placeholder="Type to search..."
                        required
                        type="text"
                        value={city}
                      />
                      <Search
                        className="absolute top-3 left-3 text-primary/50"
                        size={16}
                      />
                      {isSearching && (
                        <div className="absolute top-3 right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent" />
                      )}
                    </div>

                    {/* Search Dropdown */}
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded border border-primary/20 bg-background shadow-xl">
                        {searchResults.map((result) => (
                          <button
                            className="w-full cursor-pointer border-primary/5 border-b p-3 text-left transition-colors last:border-0 hover:bg-primary/10"
                            key={result.place_id}
                            onClick={() => selectCity(result)}
                            type="button"
                          >
                            <div className="font-bold text-foreground text-sm">
                              {result.display_name.split(",")[0]}
                            </div>
                            <div className="truncate text-foreground/50 text-xs">
                              {result.display_name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Venue
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Royal Albert Hall"
                    required
                    type="text"
                    value={venue}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                  Address (Optional)
                </FieldLabel>
                <Input
                  className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full venue address"
                  type="text"
                  value={address}
                />
              </Field>

              <div className="grid grid-cols-2 gap-6">
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Date
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                    onChange={(e) => setDate(e.target.value)}
                    required
                    type="date"
                    value={date}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Time (Optional)
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g., 7:30 PM"
                    type="text"
                    value={time}
                  />
                </Field>
              </div>

              {/* AI Helper Button */}
              <div className="flex justify-end">
                <button
                  className="flex items-center gap-2 text-foreground/70 text-xs uppercase tracking-widest transition-colors hover:text-foreground disabled:opacity-50"
                  disabled={isGenerating || !city || !venue}
                  onClick={handleGenerate}
                  type="button"
                >
                  <span
                    className={`h-2 w-2 rounded-full bg-primary ${isGenerating ? "animate-pulse" : ""}`}
                  />
                  {isGenerating
                    ? "Consulting the Oracle..."
                    : "Generate Description with AI"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Latitude
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                    onChange={(e) => setLat(e.target.value)}
                    required
                    step="0.0001"
                    type="number"
                    value={lat}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Longitude
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                    onChange={(e) => setLng(e.target.value)}
                    required
                    step="0.0001"
                    type="number"
                    value={lng}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                  Vibe Description
                </FieldLabel>
                <Textarea
                  className="min-h-[100px] w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground italic outline-none transition-colors focus:border-primary"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Generated or custom description will appear here..."
                  rows={3}
                  value={description}
                />
              </Field>

              <Button
                className="mt-4 w-full rounded bg-primary py-3 font-serif text-background text-xl transition-colors hover:bg-foreground"
                type="submit"
              >
                Add to Tour
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-12">
            <h3 className="mb-4 font-serif text-foreground text-xl">
              Current Schedule
            </h3>
            <ul className="space-y-3">
              {dates.map((d) => (
                <li
                  className="flex items-start justify-between rounded-lg border border-primary/10 bg-foreground/5 p-4"
                  key={d._id}
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-foreground/70 text-xs">
                        {d.date}
                      </span>
                      {d.time && (
                        <span className="font-mono text-foreground/60 text-xs">
                          {d.time}
                        </span>
                      )}
                      <span className="font-bold font-serif text-foreground text-lg">
                        {d.city}
                      </span>
                    </div>
                    <p className="text-foreground/80 text-sm">{d.venue}</p>
                    {d.address ? (
                      <p className="mt-1 text-foreground/60 text-xs">
                        {d.address}
                      </p>
                    ) : (
                      <p className="mt-1 text-foreground/40 text-xs italic">
                        No address set
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-foreground/50 text-xs">
                      <MapPin size={10} />
                      {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                    </div>
                  </div>
                  <button
                    className="ml-4 rounded border border-primary/20 bg-background/50 px-3 py-1.5 text-foreground/70 text-xs uppercase tracking-wider transition-colors hover:bg-primary/10 hover:text-foreground"
                    onClick={() => {
                      const index = dates.findIndex(
                        (date) => date._id === d._id
                      );
                      navigateToTourDate(index);
                      setShowAddressDialog(true);
                    }}
                    type="button"
                  >
                    Edit Details
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Attractions Section */}
          <div className="mt-12 border-primary/20 border-t pt-12">
            <h2 className="mb-8 text-center font-serif text-3xl text-foreground">
              Community Attractions
            </h2>

            <form className="relative" onSubmit={handleAttractionSubmit}>
              <FieldGroup>
                <div className="relative">
                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      Attraction Name / Search
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        autoComplete="off"
                        className="w-full rounded border border-primary/20 bg-background/50 p-3 pl-10 text-foreground outline-none transition-colors focus:border-primary"
                        onChange={(e) => handleAttractionSearch(e.target.value)}
                        onFocus={() =>
                          attractionName.length >= 3 &&
                          setShowAttractionResults(true)
                        }
                        placeholder="Type to search location..."
                        required
                        type="text"
                        value={attractionName}
                      />
                      <Search
                        className="absolute top-3 left-3 text-primary/50"
                        size={16}
                      />
                      {isAttractionSearching && (
                        <div className="absolute top-3 right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent" />
                      )}
                    </div>

                    {/* Search Dropdown */}
                    {showAttractionResults &&
                      attractionSearchResults.length > 0 && (
                        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded border border-primary/20 bg-background shadow-xl">
                          {attractionSearchResults.map((result) => (
                            <button
                              className="w-full cursor-pointer border-primary/5 border-b p-3 text-left transition-colors last:border-0 hover:bg-primary/10"
                              key={result.place_id}
                              onClick={() => selectAttractionLocation(result)}
                              type="button"
                            >
                              <div className="font-bold text-foreground text-sm">
                                {result.display_name.split(",")[0]}
                              </div>
                              <div className="truncate text-foreground/50 text-xs">
                                {result.display_name}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Address (Optional)
                  </FieldLabel>
                  <Input
                    className="w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                    onChange={(e) => setAttractionAddress(e.target.value)}
                    placeholder="Full address"
                    type="text"
                    value={attractionAddress}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      Category
                    </FieldLabel>
                    <Select
                      onValueChange={(value) =>
                        setAttractionCategory(value as AttractionCategory)
                      }
                      value={attractionCategory}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRACTION_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      City (Tour Date)
                    </FieldLabel>
                    <Select
                      onValueChange={(value) => {
                        setAttractionCity(value ?? "");
                      }}
                      value={attractionCity}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select city..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dates.map((d) => (
                          <SelectItem key={d._id} value={d.city}>
                            {d.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      Latitude
                    </FieldLabel>
                    <Input
                      className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                      onChange={(e) => setAttractionLat(e.target.value)}
                      required
                      step="0.0001"
                      type="number"
                      value={attractionLat}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                      Longitude
                    </FieldLabel>
                    <Input
                      className="w-full rounded border border-primary/20 bg-background/50 p-3 font-mono text-foreground text-sm outline-none transition-colors focus:border-primary"
                      onChange={(e) => setAttractionLng(e.target.value)}
                      required
                      step="0.0001"
                      type="number"
                      value={attractionLng}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Description (Optional)
                  </FieldLabel>
                  <Textarea
                    className="min-h-[80px] w-full rounded border border-primary/20 bg-background/50 p-3 text-foreground italic outline-none transition-colors focus:border-primary"
                    onChange={(e) => setAttractionDescription(e.target.value)}
                    placeholder="Description of the attraction..."
                    rows={2}
                    value={attractionDescription}
                  />
                </Field>

                <Button
                  className="mt-4 w-full rounded bg-primary py-3 font-serif text-background text-xl transition-colors hover:bg-foreground"
                  type="submit"
                >
                  Add Attraction
                </Button>
              </FieldGroup>
            </form>

            <div className="mt-12">
              <h3 className="mb-4 font-serif text-foreground text-xl">
                Current Attractions
              </h3>
              {attractions.length === 0 ? (
                <p className="text-foreground/40 text-sm italic">
                  No attractions added yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {attractions.map((attr) => (
                    <li
                      className="flex items-start justify-between rounded-lg border border-primary/10 bg-foreground/5 p-4"
                      key={attr._id}
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="font-serif text-foreground text-lg">
                            {attr.name}
                          </h4>
                          <span
                            className="rounded-full bg-foreground/10 px-2 py-0.5 text-foreground/70 text-xs uppercase tracking-wider"
                            style={{
                              backgroundColor: `${getCategoryColor(attr.category as AttractionCategory)}20`,
                              color: getCategoryColor(
                                attr.category as AttractionCategory
                              ).replace("0.8", "1"),
                            }}
                          >
                            {attr.category}
                          </span>
                        </div>
                        <p className="text-foreground/60 text-sm">
                          {attr.city}
                        </p>
                        {attr.address && (
                          <p className="text-foreground/50 text-xs">
                            {attr.address}
                          </p>
                        )}
                        {attr.description && (
                          <p className="mt-1 text-foreground/40 text-xs italic">
                            {attr.description}
                          </p>
                        )}
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setAttractionToDelete({
                            id: attr._id,
                            name: attr.name,
                          });
                          setShowDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <AlertDialog
            onOpenChange={setShowDeleteDialog}
            open={showDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Attraction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{attractionToDelete?.name}"?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            onOpenChange={setShowAddressDialog}
            open={showAddressDialog}
          >
            <AlertDialogContent>
              <div className="flex items-center justify-between gap-4 pb-4">
                <button
                  className="flex-shrink-0 rounded p-1 text-foreground/50 transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={currentTourDateIndex === 0}
                  onClick={handlePrevTourDate}
                  type="button"
                >
                  <ChevronLeft size={20} />
                </button>
                <AlertDialogHeader className="!grid-cols-1 flex-1">
                  <AlertDialogTitle>
                    Edit Tour Date: {addressDialogData?.city}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Update address, ticket link, and time
                  </AlertDialogDescription>
                  {dates.length > 1 && (
                    <p className="mt-1 text-foreground/40 text-xs">
                      {currentTourDateIndex + 1} of {dates.length}
                    </p>
                  )}
                </AlertDialogHeader>
                <button
                  className="flex-shrink-0 rounded p-1 text-foreground/50 transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  disabled={currentTourDateIndex === dates.length - 1}
                  onClick={handleNextTourDate}
                  type="button"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="space-y-4 py-4">
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Address
                  </FieldLabel>
                  <Input
                    onChange={(e) => setNewAddressValue(e.target.value)}
                    placeholder="Enter address"
                    value={newAddressValue}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Ticket Link
                  </FieldLabel>
                  <Input
                    onChange={(e) => setNewTicketLinkValue(e.target.value)}
                    placeholder="Enter ticket link URL"
                    type="url"
                    value={newTicketLinkValue}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-foreground/70 text-xs uppercase tracking-wider">
                    Time
                  </FieldLabel>
                  <Input
                    onChange={(e) => setNewTimeValue(e.target.value)}
                    placeholder="e.g., 7:30 PM"
                    type="text"
                    value={newTimeValue}
                  />
                </Field>
              </div>
              <AlertDialogFooter>
                <Button
                  className="mr-auto border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (addressDialogData) {
                      setTourDateToDelete({
                        id: addressDialogData.id,
                        city: addressDialogData.city,
                        venue:
                          dates.find((d) => d._id === addressDialogData.id)
                            ?.venue || "",
                      });
                      setShowTourDateDeleteDialog(true);
                    }
                  }}
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="mr-2" size={16} />
                  Delete
                </Button>
                <AlertDialogCancel
                  onClick={() => {
                    setShowAddressDialog(false);
                    setAddressDialogData(null);
                    setNewAddressValue("");
                    setNewTicketLinkValue("");
                    setNewTimeValue("");
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleAddressSubmit}>
                  Update
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            onOpenChange={setShowTourDateDeleteDialog}
            open={showTourDateDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tour Date</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the tour date for{" "}
                  {tourDateToDelete?.city} at {tourDateToDelete?.venue}? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleTourDateDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Connect Tab Content */}
      {activeTab === "connect" && (
        <div className="space-y-12">
          {/* Email Subscriptions Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-foreground text-xl">
                Email Subscriptions
              </h3>
              <Button
                className="flex items-center gap-2 border border-primary/20 bg-background/50 text-foreground hover:bg-primary/10"
                onClick={handleExportSubscriptions}
                type="button"
              >
                <Download size={16} />
                Export CSV
              </Button>
            </div>
            {emailSubscriptions.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">
                No email subscriptions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {emailSubscriptions.map((sub) => (
                  <div
                    className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                    key={sub._id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 font-serif text-foreground text-lg">
                          {sub.name}
                        </div>
                        <div className="text-foreground/70 text-sm">
                          {sub.email}
                        </div>
                        <div className="mt-2 text-foreground/50 text-xs">
                          Subscribed:{" "}
                          {new Date(sub.subscribedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setEmailSubscriptionToDelete({
                            id: sub._id,
                            name: sub.name,
                            email: sub.email,
                          });
                          setShowEmailSubscriptionDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inquiries Section */}
          <div className="border-primary/20 border-t pt-12">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-foreground text-xl">Inquiries</h3>
              <Button
                className="flex items-center gap-2 border border-primary/20 bg-background/50 text-foreground hover:bg-primary/10"
                onClick={handleExportInquiries}
                type="button"
              >
                <Download size={16} />
                Export CSV
              </Button>
            </div>
            {inquiries.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">
                No inquiries yet.
              </p>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <div
                    className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                    key={inquiry._id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {(inquiry.name || inquiry.email) && (
                          <div className="mb-2">
                            {inquiry.name && (
                              <div className="font-serif text-foreground text-lg">
                                {inquiry.name}
                              </div>
                            )}
                            {inquiry.email && (
                              <div className="text-foreground/70 text-sm">
                                {inquiry.email}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mb-2 flex flex-wrap gap-2">
                          {inquiry.inquiryTypes.map((type) => (
                            <span
                              className="rounded-full bg-primary/20 px-2 py-1 text-foreground/80 text-xs"
                              key={type}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        {inquiry.message && (
                          <p className="mb-2 line-clamp-2 text-foreground/60 text-sm">
                            {inquiry.message}
                          </p>
                        )}
                        <div className="text-foreground/50 text-xs">
                          Submitted:{" "}
                          {new Date(inquiry.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setInquiryToDelete({
                            id: inquiry._id,
                            name: inquiry.name,
                            email: inquiry.email,
                          });
                          setShowInquiryDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads Section */}
          <div className="border-primary/20 border-t pt-12">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-foreground text-xl">Leads</h3>
              <Button
                className="flex items-center gap-2 border border-primary/20 bg-background/50 text-foreground hover:bg-primary/10"
                onClick={handleExportLeads}
                type="button"
              >
                <Download size={16} />
                Export CSV
              </Button>
            </div>
            {emailSubscriptions.length === 0 &&
            inquiries.length === 0 &&
            websiteInquiries.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">No leads yet.</p>
            ) : (
              <div className="space-y-3">
                {/* Email Subscriptions as Leads */}
                {emailSubscriptions.map((sub) => (
                  <div
                    className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                    key={`sub-${sub._id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-primary/20 px-2 py-1 text-foreground/80 text-xs">
                            Email Subscription
                          </span>
                        </div>
                        <div className="mb-1 font-serif text-foreground text-lg">
                          {sub.name}
                        </div>
                        <div className="text-foreground/70 text-sm">
                          {sub.email}
                        </div>
                        <div className="mt-2 text-foreground/50 text-xs">
                          Subscribed:{" "}
                          {new Date(sub.subscribedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setEmailSubscriptionToDelete({
                            id: sub._id,
                            name: sub.name,
                            email: sub.email,
                          });
                          setShowEmailSubscriptionDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Inquiries as Leads */}
                {inquiries.map((inquiry) => (
                  <div
                    className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                    key={`inq-${inquiry._id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-primary/20 px-2 py-1 text-foreground/80 text-xs">
                            Inquiry
                          </span>
                          {inquiry.inquiryTypes.map((type) => (
                            <span
                              className="rounded-full bg-primary/20 px-2 py-1 text-foreground/80 text-xs"
                              key={type}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        {(inquiry.name || inquiry.email) && (
                          <div className="mb-2">
                            {inquiry.name && (
                              <div className="font-serif text-foreground text-lg">
                                {inquiry.name}
                              </div>
                            )}
                            {inquiry.email && (
                              <div className="text-foreground/70 text-sm">
                                {inquiry.email}
                              </div>
                            )}
                          </div>
                        )}
                        {inquiry.message && (
                          <p className="mb-2 line-clamp-2 text-foreground/60 text-sm">
                            {inquiry.message}
                          </p>
                        )}
                        <div className="text-foreground/50 text-xs">
                          Submitted:{" "}
                          {new Date(inquiry.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setInquiryToDelete({
                            id: inquiry._id,
                            name: inquiry.name,
                            email: inquiry.email,
                          });
                          setShowInquiryDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Website Inquiries as Leads */}
                {websiteInquiries.map((inquiry) => (
                  <div
                    className="rounded-lg border border-primary/10 bg-foreground/5 p-4"
                    key={`web-${inquiry._id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-primary/20 px-2 py-1 text-foreground/80 text-xs">
                            Website Inquiry
                          </span>
                        </div>
                        <div className="mb-1 font-serif text-foreground text-lg">
                          {inquiry.name}
                        </div>
                        <div className="text-foreground/70 text-sm">
                          {inquiry.email}
                        </div>
                        {inquiry.message && (
                          <p className="mt-2 mb-2 line-clamp-2 text-foreground/60 text-sm">
                            {inquiry.message}
                          </p>
                        )}
                        <div className="text-foreground/50 text-xs">
                          Submitted:{" "}
                          {new Date(inquiry.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="ml-4 text-foreground/40 transition-colors hover:text-destructive"
                        onClick={() => {
                          setWebsiteInquiryToDelete({
                            id: inquiry._id,
                            name: inquiry.name,
                            email: inquiry.email,
                          });
                          setShowWebsiteInquiryDeleteDialog(true);
                        }}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Subscription Delete Dialog */}
          <AlertDialog
            onOpenChange={setShowEmailSubscriptionDeleteDialog}
            open={showEmailSubscriptionDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Email Subscription</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the email subscription for{" "}
                  {emailSubscriptionToDelete?.name} (
                  {emailSubscriptionToDelete?.email})? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmailSubscriptionDeleteConfirm}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Inquiry Delete Dialog */}
          <AlertDialog
            onOpenChange={setShowInquiryDeleteDialog}
            open={showInquiryDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this inquiry
                  {inquiryToDelete?.name || inquiryToDelete?.email
                    ? ` from ${inquiryToDelete.name || inquiryToDelete.email}`
                    : ""}
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleInquiryDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Website Inquiry Delete Dialog */}
          <AlertDialog
            onOpenChange={setShowWebsiteInquiryDeleteDialog}
            open={showWebsiteInquiryDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Website Inquiry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the website inquiry from{" "}
                  {websiteInquiryToDelete?.name} (
                  {websiteInquiryToDelete?.email})? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWebsiteInquiryDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Email Forwarding Configuration */}
          <div className="border-primary/20 border-t pt-12">
            <h3 className="mb-4 font-serif text-foreground text-xl">Relay</h3>
            <p className="mb-4 text-foreground/60 text-sm">
              Configure email addresses to forward inbound inquiries to. Resend
              integration will be added later.
            </p>
            <div className="mb-4 flex gap-2">
              <Input
                className="flex-1 rounded border border-primary/20 bg-background/50 p-3 text-foreground outline-none transition-colors focus:border-primary"
                onChange={(e) => setNewForwardEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addForwardEmail();
                  }
                }}
                placeholder="Enter email address"
                type="email"
                value={newForwardEmail}
              />
              <Button
                className="flex items-center gap-2 border border-primary/20 bg-background/50 text-foreground hover:bg-primary/10"
                onClick={addForwardEmail}
                type="button"
              >
                <Plus size={16} />
                Add
              </Button>
            </div>
            {forwardEmails.length === 0 ? (
              <p className="text-foreground/40 text-sm italic">
                No email addresses configured.
              </p>
            ) : (
              <div className="space-y-2">
                {forwardEmails.map((email) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-primary/10 bg-foreground/5 p-3"
                    key={email}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="text-foreground/50" size={16} />
                      <span className="text-foreground text-sm">{email}</span>
                    </div>
                    <button
                      className="text-foreground/40 transition-colors hover:text-destructive"
                      onClick={() => removeForwardEmail(email)}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getCategoryColor = (category: AttractionCategory): string => {
  const colors: Record<AttractionCategory, string> = {
    environmental: "rgba(34, 139, 34, 0.8)",
    vendors: "rgba(255, 140, 0, 0.8)",
    venues: "rgba(138, 43, 226, 0.8)",
    services: "rgba(70, 130, 180, 0.8)",
    education: "rgba(25, 25, 112, 0.8)",
    art: "rgba(199, 21, 133, 0.8)",
    wellness: "rgba(255, 20, 147, 0.8)",
    miscellaneous: "rgba(128, 128, 128, 0.8)",
    accommodation: "rgba(184, 134, 11, 0.8)",
  };
  return colors[category] || "rgba(128, 128, 128, 0.8)";
};
