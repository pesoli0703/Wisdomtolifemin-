// Row types for the wtlm_* tables

export interface SiteIdentity {
  name: string;
  short_name: string;
  tagline: string;
  welcome_headline: string;
  welcome_subheadline: string;
  intro: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  maps_url: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  x: string;
  tiktok: string;
}

export interface PastorWelcome {
  name: string;
  title: string;
  photo_url: string;
  message: string;
  signature: string;
}

export interface VisionMission {
  vision: string;
  mission: string;
  objectives: string[];
}

export interface CoreValue {
  title: string;
  description: string;
}

export interface AboutContent {
  history: string;
  statement_of_faith: string[];
  core_values: CoreValue[];
}

export interface HeroContent {
  image_url: string;
  scripture: string;
}

export interface GivingContent {
  intro: string;
  note: string;
}

export interface AllSettings {
  site_identity: SiteIdentity;
  contact_info: ContactInfo;
  social_links: SocialLinks;
  pastor_welcome: PastorWelcome;
  vision_mission: VisionMission;
  about_content: AboutContent;
  hero_content: HeroContent;
  giving_content: GivingContent;
}

export interface ServiceTime {
  id: string;
  service_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface Ministry {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  long_description: string | null;
  icon: string | null;
  image_url: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  contact_email: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface Leader {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  is_pastor: boolean;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export type EventCategory =
  | "service"
  | "conference"
  | "prayer"
  | "revival"
  | "programme"
  | "outreach";

export interface ChurchEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: EventCategory;
  start_at: string;
  end_at: string | null;
  location: string | null;
  image_url: string | null;
  registration_required: boolean;
  registration_open: boolean;
  published: boolean;
  featured: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface Sermon {
  id: string;
  slug: string;
  title: string;
  preacher: string;
  series: string | null;
  scripture: string | null;
  description: string | null;
  youtube_url: string | null;
  audio_url: string | null;
  sermon_date: string;
  published: boolean;
  created_at: string;
}

export interface Testimony {
  id: string;
  name: string;
  location: string | null;
  content: string;
  image_url: string | null;
  approved: boolean;
  sort_order: number;
  created_at: string;
}

export interface GalleryMedia {
  id: string;
  title: string | null;
  category: string;
  media_type: "photo" | "video";
  storage_path: string | null;
  public_url: string | null;
  youtube_url: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  starts_at: string;
  ends_at: string | null;
  published: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  full_name: string | null;
  email: string | null;
  request: string;
  status: "new" | "praying" | "answered" | "archived";
  created_at: string;
}

export interface Donation {
  id: string;
  category: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  flw_tx_ref: string;
  flutterwave_tx_id: number | null;
  status: "pending" | "completed" | "failed";
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}
