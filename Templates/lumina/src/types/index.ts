export interface ServiceItem {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  tag: string;
  duration: string;
  approach: string;
  benefits: string[];
  idealFor: string;
}

export interface Specialist {
  id: string;
  name: string;
  role: string;
  experience: string;
  image: string;
  specialtyAreas: string[];
  quote: string;
  days: string;
  degree: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  aspect: 'wide' | 'tall' | 'square';
}

export interface Testimonial {
  id: string;
  name: string;
  treatment: string;
  comment: string;
  avatar: string;
  duration: string;
  rating: number;
}

export interface ConsultationTier {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  features: string[];
  isPopular?: boolean;
  timeframe: string;
  recommendedFor: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface BookingFormData {
  fullName: string;
  phone: string;
  serviceId: string;
  specialistId: string;
  preferredTime: string;
  preferredDate: string;
  notes: string;
}
