import type {
  AllSettings,
  Ministry,
  ServiceTime,
} from "./types";

/**
 * Fallback content used when the Supabase connection is not configured
 * or unavailable. Mirrors the seeded database content so the site always
 * renders. Placeholders in [brackets] must be updated from the Admin
 * Dashboard once real information is provided.
 */
export const defaultSettings: AllSettings = {
  site_identity: {
    name: "Wisdom To Life Ministry",
    short_name: "WTLM",
    tagline: "God's wisdom. Real life. Lasting transformation.",
    welcome_headline: "Welcome Home — Where Wisdom Meets Life",
    welcome_subheadline:
      "A place of faith, hope and transformation. Come as you are and discover the life-changing wisdom of God with a warm family of believers.",
    intro:
      "Wisdom To Life Ministry is a Bible-believing Christian ministry dedicated to helping people discover, receive and apply God's wisdom to everyday life — in their families, work, studies and walk with Christ.",
  },
  contact_info: {
    email: "Wisdomtolifemin@gmail.com",
    phone: "[Add church phone number]",
    whatsapp: "[Add WhatsApp number]",
    address: "[Add church physical address]",
    city: "[Add city / state]",
    maps_url: "[Add Google Maps link to church location]",
  },
  social_links: {
    facebook: "",
    instagram: "",
    youtube: "",
    x: "",
    tiktok: "",
  },
  pastor_welcome: {
    name: "[Add Senior Pastor's name]",
    title: "Senior Pastor",
    photo_url: "/images/pastor-welcome.jpg",
    message:
      "[Add the pastor's welcome message here. Example structure: a warm greeting to visitors, a short word about what God is doing in the ministry, and an invitation to join a service. Edit this from the Admin Dashboard under Site Content.]",
    signature: "In His service",
  },
  vision_mission: {
    vision:
      "To raise a generation of people whose lives are transformed by the wisdom of God — walking in faith, love and purpose in every area of life.",
    mission:
      "We exist to preach the unchanging Word of God, disciple believers into maturity, serve our community with the love of Christ, and demonstrate that God's wisdom is practical for everyday life.",
    objectives: [
      "To teach the Bible clearly so that visitors and members can apply God's wisdom daily.",
      "To build a warm, welcoming community where every person is known and cared for.",
      "To raise and equip leaders for the ministry and the marketplace.",
      "To reach the lost through evangelism, outreach and acts of compassion.",
      "To pray consistently for members, the community and the nations.",
    ],
  },
  about_content: {
    history:
      "[Add the history of the ministry here — when it was founded, how it began, key milestones and seasons of growth. This text is editable from the Admin Dashboard under Site Content.]",
    statement_of_faith: [
      "[Add ministry statement of faith — e.g. beliefs about the Bible, the Trinity, salvation, the Church and the return of Christ. Editable from the Admin Dashboard.]",
    ],
    core_values: [
      {
        title: "The Word of God",
        description:
          "The Bible is our final authority for faith, conduct and ministry.",
      },
      {
        title: "Prayer",
        description: "We depend on God and seek His face in every season.",
      },
      {
        title: "Love & Family",
        description:
          "We welcome everyone as Christ welcomed us and grow as one family.",
      },
      {
        title: "Wisdom in Practice",
        description:
          "We believe God's wisdom must be lived out at home, at work and in the community.",
      },
      {
        title: "Integrity",
        description:
          "We serve with honesty, accountability and transparency before God and people.",
      },
      {
        title: "Excellence",
        description:
          "We give our best to God in worship, ministry and stewardship.",
      },
    ],
  },
  hero_content: {
    image_url: "/images/hero-worship.jpg",
    scripture:
      "Wisdom is the principal thing; therefore get wisdom — Proverbs 4:7 (KJV)",
  },
  giving_content: {
    intro:
      "Your giving supports the work of the ministry — outreach, church programmes, the building project and caring for people in need. Every gift is received with gratitude and stewarded with integrity.",
    note: "Online giving is processed securely via Flutterwave. [Add bank account details here for manual transfers — editable from the Admin Dashboard.]",
  },
};

export const defaultServiceTimes: ServiceTime[] = [
  {
    id: "default-1",
    service_name: "Sunday Worship Service",
    day_of_week: "Sunday",
    start_time: "[Confirm time]",
    end_time: null,
    description:
      "Main weekly worship and Word service. [Confirm schedule in Admin Dashboard]",
    sort_order: 1,
    published: true,
    created_at: "",
  },
  {
    id: "default-2",
    service_name: "Midweek Service",
    day_of_week: "[Confirm day]",
    start_time: "[Confirm time]",
    end_time: null,
    description:
      "Midweek Bible teaching and worship. [Confirm schedule in Admin Dashboard]",
    sort_order: 2,
    published: true,
    created_at: "",
  },
  {
    id: "default-3",
    service_name: "Prayer Meeting",
    day_of_week: "[Confirm day]",
    start_time: "[Confirm time]",
    end_time: null,
    description:
      "Corporate prayer and intercession. [Confirm schedule in Admin Dashboard]",
    sort_order: 3,
    published: true,
    created_at: "",
  },
];

export const defaultMinistries: Ministry[] = [
  {
    id: "m1",
    slug: "childrens-ministry",
    name: "Children's Ministry",
    tagline: "Raising a generation that knows God early",
    description:
      "A safe, joyful environment where children learn the Word of God through creative teaching, worship, Bible memory and fun activities tailored to their age groups.",
    long_description: null,
    icon: "children",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 1,
    published: true,
    created_at: "",
  },
  {
    id: "m2",
    slug: "youth-ministry",
    name: "Youth Ministry",
    tagline: "Faith, purpose and fire for the next generation",
    description:
      "Empowering teenagers and young adults to live wisely in today's world through dynamic worship, relevant Bible teaching, mentorship and fellowship activities.",
    long_description: null,
    icon: "youth",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 2,
    published: true,
    created_at: "",
  },
  {
    id: "m3",
    slug: "womens-ministry",
    name: "Women's Ministry",
    tagline: "Women of wisdom, strength and grace",
    description:
      "Building up women in faith, character and purpose through Bible study, mentorship, retreats and outreach, so that every woman thrives in her God-given role.",
    long_description: null,
    icon: "women",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 3,
    published: true,
    created_at: "",
  },
  {
    id: "m4",
    slug: "mens-ministry",
    name: "Men's Ministry",
    tagline: "Men of valour, integrity and wisdom",
    description:
      "Equipping men to lead their homes, workplaces and the church with godly character through fellowship, accountability, Bible study and mentorship programmes.",
    long_description: null,
    icon: "men",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 4,
    published: true,
    created_at: "",
  },
  {
    id: "m5",
    slug: "worship-choir",
    name: "Worship & Choir",
    tagline: "Lifting the name of Jesus with excellence",
    description:
      "The music and worship arm of the ministry — a team of vocalists and instrumentalists dedicated to leading the congregation into God's presence with skill and heart.",
    long_description: null,
    icon: "worship",
    image_url: null,
    meeting_day: "[Add rehearsal day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 5,
    published: true,
    created_at: "",
  },
  {
    id: "m6",
    slug: "evangelism-outreach",
    name: "Evangelism & Outreach",
    tagline: "Taking the good news beyond the walls",
    description:
      "Organising street evangelism, community outreach, hospital and prison visits, and mission programmes to reach the lost and serve the needy with the love of Christ.",
    long_description: null,
    icon: "outreach",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 6,
    published: true,
    created_at: "",
  },
  {
    id: "m7",
    slug: "prayer-ministry",
    name: "Prayer Ministry",
    tagline: "A house of prayer for all nations",
    description:
      "Coordinating the prayer life of the ministry — prayer meetings, intercession for members and the nations, counselling prayer support and the 24/7 prayer chain.",
    long_description: null,
    icon: "prayer",
    image_url: null,
    meeting_day: "[Add day]",
    meeting_time: "[Add time]",
    contact_email: null,
    sort_order: 7,
    published: true,
    created_at: "",
  },
];
