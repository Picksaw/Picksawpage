import { CLINIC_IMAGES } from './images';
import { CLINIC_TEXTS } from './texts';

export interface ServiceItem {
  id: string;
  number: string;
  name: string;
  description: string;
  tag: string;
  image: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface PhilosophyItem {
  id: string;
  keyword: string;
  title: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: string;
  aspect: 'portrait' | 'landscape' | 'square' | 'tall';
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
}

export const CLINIC_CONFIG = {
  // Brand
  CLINIC_NAME: CLINIC_TEXTS.BRAND_NAME_FA,
  CLINIC_NAME_EN: CLINIC_TEXTS.BRAND_NAME_EN,
  CLINIC_TAGLINE: CLINIC_TEXTS.TAGLINE,
  CLINIC_CATEGORY: CLINIC_TEXTS.BRAND_SUBTITLE,
  
  // Doctor
  DOCTOR_NAME: CLINIC_TEXTS.DOCTOR_NAME,
  DOCTOR_TITLE: CLINIC_TEXTS.DOCTOR_TITLE,
  DOCTOR_BIO: CLINIC_TEXTS.DOCTOR_BIO,
  DOCTOR_IMAGE: CLINIC_IMAGES.DOCTOR_IMAGE,

  // Contact
  PHONE_NUMBER: CLINIC_TEXTS.PHONE_DISPLAY,
  PHONE_NUMBER_RAW: CLINIC_TEXTS.PHONE_RAW,
  MOBILE_NUMBER: CLINIC_TEXTS.MOBILE_DISPLAY,
  MOBILE_NUMBER_RAW: CLINIC_TEXTS.MOBILE_RAW,
  WHATSAPP_NUMBER: CLINIC_TEXTS.WHATSAPP_NUMBER,
  INSTAGRAM_URL: CLINIC_TEXTS.INSTAGRAM_URL,
  INSTAGRAM_HANDLE: CLINIC_TEXTS.INSTAGRAM_HANDLE,

  // Address & Hours
  ADDRESS: CLINIC_TEXTS.ADDRESS,
  WORKING_HOURS: CLINIC_TEXTS.WORKING_HOURS,

  // Maps
  MAP_BALAD_URL: CLINIC_TEXTS.MAP_BALAD_URL,
  MAP_NESHAN_URL: CLINIC_TEXTS.MAP_NESHAN_URL,
  MAP_GOOGLE_URL: CLINIC_TEXTS.MAP_GOOGLE_URL,

  // Services
  SERVICE_01_NAME: CLINIC_TEXTS.SERVICE_01_NAME,
  SERVICE_01_DESCRIPTION: CLINIC_TEXTS.SERVICE_01_DESC,
  SERVICE_01_IMAGE: CLINIC_IMAGES.SERVICE_01,

  SERVICE_02_NAME: CLINIC_TEXTS.SERVICE_02_NAME,
  SERVICE_02_DESCRIPTION: CLINIC_TEXTS.SERVICE_02_DESC,
  SERVICE_02_IMAGE: CLINIC_IMAGES.SERVICE_02,

  SERVICE_03_NAME: CLINIC_TEXTS.SERVICE_03_NAME,
  SERVICE_03_DESCRIPTION: CLINIC_TEXTS.SERVICE_03_DESC,
  SERVICE_03_IMAGE: CLINIC_IMAGES.SERVICE_03,

  SERVICE_04_NAME: CLINIC_TEXTS.SERVICE_04_NAME,
  SERVICE_04_DESCRIPTION: CLINIC_TEXTS.SERVICE_04_DESC,
  SERVICE_04_IMAGE: CLINIC_IMAGES.SERVICE_04,

  SERVICE_05_NAME: CLINIC_TEXTS.SERVICE_05_NAME,
  SERVICE_05_DESCRIPTION: CLINIC_TEXTS.SERVICE_05_DESC,
  SERVICE_05_IMAGE: CLINIC_IMAGES.SERVICE_05,

  // Hero & Feature Assets
  HERO_PORTRAIT: CLINIC_IMAGES.HERO_PORTRAIT,
  HERO_DETAIL: CLINIC_IMAGES.HERO_DETAIL,
  FEATURE_IMAGE: CLINIC_IMAGES.FEATURE_IMAGE,

  // Gallery
  GALLERY_IMAGE_01: CLINIC_IMAGES.GALLERY_01,
  GALLERY_IMAGE_02: CLINIC_IMAGES.GALLERY_02,
  GALLERY_IMAGE_03: CLINIC_IMAGES.GALLERY_03,
  GALLERY_IMAGE_04: CLINIC_IMAGES.GALLERY_04,
  GALLERY_IMAGE_05: CLINIC_IMAGES.GALLERY_05,
  GALLERY_IMAGE_06: CLINIC_IMAGES.GALLERY_06,

  // Philosophy Points
  PHILOSOPHY: [
    {
      id: "precision",
      keyword: CLINIC_TEXTS.PHILOSOPHY_1_KEYWORD,
      title: CLINIC_TEXTS.PHILOSOPHY_1_TITLE,
      description: CLINIC_TEXTS.PHILOSOPHY_1_DESC,
    },
    {
      id: "balance",
      keyword: CLINIC_TEXTS.PHILOSOPHY_2_KEYWORD,
      title: CLINIC_TEXTS.PHILOSOPHY_2_TITLE,
      description: CLINIC_TEXTS.PHILOSOPHY_2_DESC,
    },
    {
      id: "natural",
      keyword: CLINIC_TEXTS.PHILOSOPHY_3_KEYWORD,
      title: CLINIC_TEXTS.PHILOSOPHY_3_TITLE,
      description: CLINIC_TEXTS.PHILOSOPHY_3_DESC,
    }
  ] as PhilosophyItem[],

  // Process Steps
  PROCESS_STEPS: [
    {
      number: CLINIC_TEXTS.STEP_01_NUM,
      title: CLINIC_TEXTS.STEP_01_TITLE,
      subtitle: CLINIC_TEXTS.STEP_01_SUB,
      description: CLINIC_TEXTS.STEP_01_DESC,
    },
    {
      number: CLINIC_TEXTS.STEP_02_NUM,
      title: CLINIC_TEXTS.STEP_02_TITLE,
      subtitle: CLINIC_TEXTS.STEP_02_SUB,
      description: CLINIC_TEXTS.STEP_02_DESC,
    },
    {
      number: CLINIC_TEXTS.STEP_03_NUM,
      title: CLINIC_TEXTS.STEP_03_TITLE,
      subtitle: CLINIC_TEXTS.STEP_03_SUB,
      description: CLINIC_TEXTS.STEP_03_DESC,
    },
    {
      number: CLINIC_TEXTS.STEP_04_NUM,
      title: CLINIC_TEXTS.STEP_04_TITLE,
      subtitle: CLINIC_TEXTS.STEP_04_SUB,
      description: CLINIC_TEXTS.STEP_04_DESC,
    }
  ] as ProcessStep[],

  // Instagram Feed Images
  INSTAGRAM_POSTS: [
    {
      id: "ig-1",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_01,
      caption: CLINIC_TEXTS.IG_POST_01
    },
    {
      id: "ig-2",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_02,
      caption: CLINIC_TEXTS.IG_POST_02
    },
    {
      id: "ig-3",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_03,
      caption: CLINIC_TEXTS.IG_POST_03
    },
    {
      id: "ig-4",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_04,
      caption: CLINIC_TEXTS.IG_POST_04
    },
    {
      id: "ig-5",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_05,
      caption: CLINIC_TEXTS.IG_POST_05
    },
    {
      id: "ig-6",
      imageUrl: CLINIC_IMAGES.INSTAGRAM_06,
      caption: CLINIC_TEXTS.IG_POST_06
    }
  ] as InstagramPost[]
};

export const SERVICES_LIST: ServiceItem[] = [
  {
    id: "service-1",
    number: CLINIC_TEXTS.SERVICE_01_NUM,
    name: CLINIC_TEXTS.SERVICE_01_NAME,
    description: CLINIC_TEXTS.SERVICE_01_DESC,
    tag: CLINIC_TEXTS.SERVICE_01_TAG,
    image: CLINIC_IMAGES.SERVICE_01
  },
  {
    id: "service-2",
    number: CLINIC_TEXTS.SERVICE_02_NUM,
    name: CLINIC_TEXTS.SERVICE_02_NAME,
    description: CLINIC_TEXTS.SERVICE_02_DESC,
    tag: CLINIC_TEXTS.SERVICE_02_TAG,
    image: CLINIC_IMAGES.SERVICE_02
  },
  {
    id: "service-3",
    number: CLINIC_TEXTS.SERVICE_03_NUM,
    name: CLINIC_TEXTS.SERVICE_03_NAME,
    description: CLINIC_TEXTS.SERVICE_03_DESC,
    tag: CLINIC_TEXTS.SERVICE_03_TAG,
    image: CLINIC_IMAGES.SERVICE_03
  },
  {
    id: "service-4",
    number: CLINIC_TEXTS.SERVICE_04_NUM,
    name: CLINIC_TEXTS.SERVICE_04_NAME,
    description: CLINIC_TEXTS.SERVICE_04_DESC,
    tag: CLINIC_TEXTS.SERVICE_04_TAG,
    image: CLINIC_IMAGES.SERVICE_04
  },
  {
    id: "service-5",
    number: CLINIC_TEXTS.SERVICE_05_NUM,
    name: CLINIC_TEXTS.SERVICE_05_NAME,
    description: CLINIC_TEXTS.SERVICE_05_DESC,
    tag: CLINIC_TEXTS.SERVICE_05_TAG,
    image: CLINIC_IMAGES.SERVICE_05
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    url: CLINIC_IMAGES.GALLERY_01,
    title: CLINIC_TEXTS.GALLERY_ITEM_01_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_01_CAT,
    aspect: "landscape"
  },
  {
    id: "gal-2",
    url: CLINIC_IMAGES.GALLERY_02,
    title: CLINIC_TEXTS.GALLERY_ITEM_02_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_02_CAT,
    aspect: "portrait"
  },
  {
    id: "gal-3",
    url: CLINIC_IMAGES.GALLERY_03,
    title: CLINIC_TEXTS.GALLERY_ITEM_03_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_03_CAT,
    aspect: "portrait"
  },
  {
    id: "gal-4",
    url: CLINIC_IMAGES.GALLERY_04,
    title: CLINIC_TEXTS.GALLERY_ITEM_04_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_04_CAT,
    aspect: "square"
  },
  {
    id: "gal-5",
    url: CLINIC_IMAGES.GALLERY_05,
    title: CLINIC_TEXTS.GALLERY_ITEM_05_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_05_CAT,
    aspect: "landscape"
  },
  {
    id: "gal-6",
    url: CLINIC_IMAGES.GALLERY_06,
    title: CLINIC_TEXTS.GALLERY_ITEM_06_TITLE,
    category: CLINIC_TEXTS.GALLERY_ITEM_06_CAT,
    aspect: "portrait"
  }
];
